import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Content, Part } from '@google/genai';
import type { ChatMessage, FileName, Command, ModelId, TurnLog, LogEntry, Applet } from './types';
import { Sender } from './types';
import { INITIAL_HTML, INITIAL_CSS, INITIAL_JS, SYSTEM_INSTRUCTION, MODELS } from './constants';
import { generateCodeStream } from './services/geminiService';
import { parseGeminiResponse, parseInlineEdit } from './utils/parser';
import { performInlineEdit } from './utils/inline-edit';
import { shouldContinueAfterTurn } from './ai/recursion';
import { loadAppletsFromStorage, saveAppletsToStorage, getClientApiKey, setClientApiKey } from './utils/storage';
import { fileToBase64 } from './utils/fileUtils';
import ChatPanel from './components/ChatPanel';
import MainContent from './components/MainContent';
import SettingsModal from './components/SettingsModal';
import RawOutputModal from './components/RawOutputModal';
import LogsModal from './components/LogsModal';
import Toast from './components/Toast';
import FileOverlay from './components/FileOverlay';

const createNewApplet = (name: string): Applet => ({
    id: `applet_${Date.now()}`,
    name,
    html: INITIAL_HTML,
    css: INITIAL_CSS,
    js: INITIAL_JS,
    chatHistory: [],
    modelHistory: [],
    fullLogHistory: [],
});

const App: React.FC = () => {
    const [applets, setApplets] = useState<Applet[]>([]);
    const [activeAppletId, setActiveAppletId] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentStatus, setCurrentStatus] = useState<string>('Ready');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isRawOutputModalOpen, setIsRawOutputModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [isFileOverlayOpen, setIsFileOverlayOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState<ModelId>(MODELS[0].id);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'info' | 'warning' | 'error'>('info');
    
    const previewUpdateTimeoutRef = useRef<number | null>(null);
    const filesRef = useRef<Record<FileName, string>>({ 'index.html': '', 'styles.css': '', 'script.js': '' });

    const activeApplet = applets.find(a => a.id === activeAppletId);

    // Load from storage on initial render
    useEffect(() => {
        const savedApplets = loadAppletsFromStorage();
        if (savedApplets.length > 0) {
            setApplets(savedApplets);
            setActiveAppletId(savedApplets[0].id);
        } else {
            const newApplet = createNewApplet('My First App');
            setApplets([newApplet]);
            setActiveAppletId(newApplet.id);
        }
    }, []);

    // Save to storage whenever applets change
    useEffect(() => {
        if (applets.length > 0) {
            saveAppletsToStorage(applets);
        }
    }, [applets]);
    
    // Update filesRef when active applet changes
    useEffect(() => {
        if (activeApplet) {
            filesRef.current = {
                'index.html': activeApplet.html,
                'styles.css': activeApplet.css,
                'script.js': activeApplet.js,
            };
        }
    }, [activeApplet]);

    useEffect(() => {
        if (!isLoading) {
            setCurrentStatus('Ready');
        }
    }, [isLoading]);

    const showToast = useCallback((message: string | null, type: 'info' | 'warning' | 'error' = 'info') => {
        setToastMessage(message);
        setToastType(type);
    }, []);


    const updateActiveApplet = (updater: (prev: Applet) => Applet) => {
        setApplets(prevApplets => prevApplets.map(applet => 
            applet.id === activeAppletId ? updater(applet) : applet
        ));
    };

    const executeFileCommands = (commands: Command[]): { logs: LogEntry[], changes: Partial<Record<FileName, string>> } => {
        const logs: LogEntry[] = [];
        const changes: Partial<Record<FileName, string>> = {};
        const fileCommands = commands.filter(c => c.fileName);

        fileCommands.forEach(cmd => {
            if (!cmd.fileName || filesRef.current[cmd.fileName] === undefined) {
                logs.push({ command: `${cmd.name}(${cmd.fileName || 'unknown'})`, status: 'failure', message: `Invalid filename provided.` });
                return;
            };

            const currentContent = filesRef.current[cmd.fileName];
            const commandIdentifier = `${cmd.name}(${cmd.fileName}${cmd.lineNumber ? ', ' + cmd.lineNumber : ''})`;

            switch (cmd.name) {
                case 'edit':
                    filesRef.current[cmd.fileName] = cmd.content;
                    changes[cmd.fileName] = cmd.content;
                    logs.push({ command: commandIdentifier, status: 'success', message: `File '${cmd.fileName}' was completely replaced.` });
                    break;
                case 'inline_edit': {
                    const parsed = parseInlineEdit(cmd.content);
                    if (!parsed) {
                        logs.push({ command: commandIdentifier, status: 'failure', message: `Invalid format for inline_edit. Could not parse [[find]]/[[replace]] blocks.` });
                        return;
                    }
                    
                    const result = performInlineEdit(
                        cmd.fileName,
                        currentContent,
                        cmd.lineNumber!,
                        parsed.find,
                        parsed.replace
                    );

                    if (result.success) {
                        filesRef.current[cmd.fileName] = result.newContent!;
                        changes[cmd.fileName] = result.newContent!;
                        logs.push({ command: commandIdentifier, status: 'success', message: `Edit applied to '${cmd.fileName}'.` });
                    } else {
                        logs.push({ command: commandIdentifier, status: 'failure', message: result.errorLog! });
                    }
                    break;
                }
            }
        });
        return { logs, changes };
    }

    const processAndRunGemini = useCallback(async (
        userContentParts: Part[], 
        continuationModelHistory?: Content[],
        previousTurnLogsForRecursion?: LogEntry[],
    ) => {
        if (!activeApplet) return;

        setIsLoading(true);
        setCurrentStatus('Thinking...');
        
        let currentModelHistory: Content[];
        let previousTurnFailures: LogEntry[];

        if (continuationModelHistory && previousTurnLogsForRecursion) {
            // This is a recursive call. Use the history and logs passed directly from the previous execution to avoid stale state.
            currentModelHistory = continuationModelHistory;
            previousTurnFailures = previousTurnLogsForRecursion.filter(l => l.status === 'failure');
            if (previousTurnFailures.length === 0) {
                updateActiveApplet(a => ({...a, chatHistory: [...a.chatHistory, { sender: Sender.System, message: 'Continuing work...' }]}));
            }
        } else {
            // This is a user-initiated call. Build history from current state and get failures from the last completed turn.
            const lastTurnInHistory = activeApplet.fullLogHistory[activeApplet.fullLogHistory.length - 1];
            previousTurnFailures = lastTurnInHistory?.logs.filter(l => l.status === 'failure') || [];

            const userTextPart = userContentParts.find(p => 'text' in p);
            const userMessage = userTextPart && 'text' in userTextPart ? userTextPart.text : '(User sent multimodal content)';
            updateActiveApplet(a => ({...a, chatHistory: [...a.chatHistory, { sender: Sender.User, message: userMessage }]}));
            currentModelHistory = [...activeApplet.modelHistory, { role: 'user', parts: userContentParts }];
            updateActiveApplet(a => ({...a, modelHistory: currentModelHistory}));
        }

        if (previousTurnFailures.length > 0) {
            const logText = previousTurnFailures.map(l => `Command: ${l.command}\nStatus: ${l.status}\nMessage: ${l.message}`).join('\n\n');
            const observation = `OBSERVATION: The previous command(s) failed with the following error(s). You must correct your next command based on this information.\n\n${logText}`;
            currentModelHistory.push({ role: 'user', parts: [{ text: observation }] });
            updateActiveApplet(a => ({...a, chatHistory: [...a.chatHistory, { sender: Sender.System, message: `Tool Error:\n${logText}` }]}));
        }

        updateActiveApplet(a => ({...a, chatHistory: [
            ...a.chatHistory,
            { sender: Sender.Reasoning, message: '' },
            { sender: Sender.Model, message: '' }
        ]}));

        const lastTurnLogs = activeApplet.fullLogHistory[activeApplet.fullLogHistory.length - 1]?.logs || [];
        const logsForPrompt = lastTurnLogs.length > 0
            ? lastTurnLogs.map(l => `- ${l.command}: ${l.status.toUpperCase()}`).join('\n')
            : 'No commands executed yet in the previous turn.';

        const fullSystemInstruction = `
            ${SYSTEM_INSTRUCTION}

            --- OBSERVATION LOGS (PREVIOUS TURN) ---
            ${logsForPrompt}
            --- END LOGS ---

            Here is the current state of the files:

            --- START index.html ---
            ${filesRef.current['index.html']}
            --- END index.html ---

            --- START styles.css ---
            ${filesRef.current['styles.css']}
            --- END styles.css ---

            --- START script.js ---
            ${filesRef.current['script.js']}
            --- END script.js ---
        `;
        
        let fullResponseText = '';
        try {
            const result = await generateCodeStream(fullSystemInstruction, currentModelHistory, selectedModel);

            // FIX: Iterate directly over 'result' as it's now an AsyncIterable matching SDK's return type.
            for await (const chunk of result) {
                fullResponseText += chunk.text;
                const { commands } = parseGeminiResponse(fullResponseText);
                
                const reasoningText = commands.filter(c => c.name === 'reasoning').map(c => c.content).join('\n\n');
                const chatText = commands.filter(c => c.name === 'chat').map(c => c.content).join('\n\n');
                
                const lastCommand = commands.length > 0 ? commands[commands.length - 1] : null;
                if (lastCommand && !lastCommand.isTerminated) {
                    switch (lastCommand.name) {
                        case 'chat': setCurrentStatus('Chatting with user...'); break;
                        case 'reasoning': setCurrentStatus('Reasoning...'); break;
                        case 'edit':
                        case 'inline_edit':
                            setCurrentStatus(`Editing ${lastCommand.fileName}...`);
                            break;
                    }
                } else if (lastCommand && lastCommand.isTerminated) {
                     setCurrentStatus('Thinking...');
                }

                updateActiveApplet(a => {
                    let reasoningUpdated = false;
                    let chatUpdated = false;
                    const newHistory = [...a.chatHistory].reverse().map(msg => {
                        if (!reasoningUpdated && msg.sender === Sender.Reasoning) {
                            reasoningUpdated = true;
                            return { ...msg, message: reasoningText };
                        }
                        if (!chatUpdated && msg.sender === Sender.Model) {
                            chatUpdated = true;
                            return { ...msg, message: chatText };
                        }
                        return msg;
                    }).reverse();
                    return {...a, chatHistory: newHistory};
                });
            }

            if (previewUpdateTimeoutRef.current) clearTimeout(previewUpdateTimeoutRef.current);
            
            // FIX: Removed `await result.response;` because the updated SDK returns a direct async iterable
            // and the `for await...of` loop already handles stream finalization.

            const { commands } = parseGeminiResponse(fullResponseText);
            
            const reasoningText = commands.filter(c => c.name === 'reasoning').map(c => c.content).join('\n\n');
            const chatText = commands.filter(c => c.name === 'chat').map(c => c.content).join('\n\n');
            const executedCommands = commands.filter(c => c.name !== 'chat' && c.name !== 'reasoning');

            updateActiveApplet(a => {
                let reasoningUpdated = false;
                let chatUpdated = false;
                const newHistory = [...a.chatHistory].reverse().map(msg => {
                    if (!reasoningUpdated && msg.sender === Sender.Reasoning) {
                        reasoningUpdated = true;
                        return { ...msg, message: reasoningText };
                    }
                    if (!chatUpdated && msg.sender === Sender.Model) {
                        chatUpdated = true;
                        return { ...msg, message: chatText, commands: executedCommands.length > 0 ? executedCommands : undefined };
                    }
                    return msg;
                }).reverse();
                return {...a, chatHistory: newHistory.filter(msg => !(msg.sender === Sender.Reasoning && !msg.message.trim()))};
            });
            
            const { logs: fileCommandLogs, changes } = executeFileCommands(commands);
            if (Object.keys(changes).length > 0) {
                 updateActiveApplet(a => ({
                    ...a,
                    html: changes['index.html'] !== undefined ? changes['index.html'] : a.html,
                    css: changes['styles.css'] !== undefined ? changes['styles.css'] : a.css,
                    js: changes['script.js'] !== undefined ? changes['script.js'] : a.js,
                }));
            }

            const turnLogs: LogEntry[] = [];
            commands.forEach(cmd => {
                if (['reasoning', 'chat', 'task_completed'].includes(cmd.name)) {
                    turnLogs.push({ command: `${cmd.name}()`, status: 'success', message: 'Command parsed.' });
                }
            });
            turnLogs.push(...fileCommandLogs);
            
            updateActiveApplet(a => ({...a, fullLogHistory: [...a.fullLogHistory, {
                turnNumber: a.fullLogHistory.length + 1,
                rawOutput: fullResponseText,
                logs: turnLogs,
            }]}));
            
            if (fullResponseText.trim() || commands.length > 0) { // Check for commands too, in case model only emits commands
                const newModelHistory = [...currentModelHistory, { role: 'model', parts: [{ text: fullResponseText }] }];
                updateActiveApplet(a => ({...a, modelHistory: newModelHistory}));

                const shouldRecurse = shouldContinueAfterTurn(commands);

                if (shouldRecurse) {
                    setTimeout(() => {
                        processAndRunGemini([], newModelHistory, turnLogs); // Continue recursion with new history and logs
                    }, 500);
                } else {
                    setIsLoading(false);
                }
            } else {
                updateActiveApplet(a => ({...a, chatHistory: a.chatHistory.filter(msg => {
                    return !( (msg.sender === Sender.Reasoning || msg.sender === Sender.Model) && msg.message.trim() === '' )
                })}));
                setIsLoading(false);
            }

        } catch (error) {
            if (previewUpdateTimeoutRef.current) clearTimeout(previewUpdateTimeoutRef.current);
            console.error("Error calling Gemini API:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

            if (!getClientApiKey() && (errorMessage.includes('429') || /rate limit/i.test(errorMessage))) {
                showToast("The developer key is busy. For better performance, please add your own Gemini API key in settings.", 'warning');
            }

            updateActiveApplet(a => ({...a, chatHistory: [
                ...a.chatHistory.filter(msg => msg.message.trim() !== ''),
                { sender: Sender.System, message: `Error: ${errorMessage}` }
            ]}));
            setIsLoading(false);
        }
    }, [activeApplet, selectedModel, showToast]);

    const handleSendMessage = useCallback(async (message: string, files: {file: File, previewUrl: string}[]) => {
        if (!activeApplet) return;

        let userContentParts: Part[] = [];
        if (message.trim()) {
            userContentParts.push({ text: message });
        }

        if (files.length > 0) {
            setCurrentStatus('Uploading images...');
            const imagePartsPromises = files.map(async ({ file }) => {
                const { mimeType, data } = await fileToBase64(file);
                return { inlineData: { mimeType, data } };
            });
            const imageParts = await Promise.all(imagePartsPromises);
            userContentParts.push(...imageParts);
        }

        if (userContentParts.length === 0) {
            console.warn("No message or files to send.");
            return;
        }

        await processAndRunGemini(userContentParts);
    }, [activeApplet, processAndRunGemini]);


    const handleResetApplet = () => {
        if (!activeAppletId) return;
        const appletToReset = applets.find(a => a.id === activeAppletId);
        if (appletToReset) {
            updateActiveApplet(a => ({
                ...a,
                html: INITIAL_HTML,
                css: INITIAL_CSS,
                js: INITIAL_JS,
                chatHistory: [],
                modelHistory: [],
                fullLogHistory: [],
            }));
        }
    };

    const handleCreateApplet = () => {
        const newName = window.prompt("Enter a name for your new applet:", `Applet ${applets.length + 1}`);
        if (newName) {
            const newApplet = createNewApplet(newName);
            setApplets(prev => [...prev, newApplet]);
            setActiveAppletId(newApplet.id);
        }
    };
    
    if (!activeApplet) {
        return <div className="bg-[#111111] h-screen flex items-center justify-center text-white">Loading Applets...</div>;
    }

    return (
        <div className="bg-[#f0f0f0] dark:bg-[#111111] text-[#333] dark:text-[#E0E0E0] h-screen flex flex-col font-sans overflow-hidden">
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onResetApplet={handleResetApplet}
                onOpenRawOutput={() => setIsRawOutputModalOpen(true)}
                onOpenLogs={() => setIsLogsModalOpen(true)}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                setToastMessage={showToast}
            />
            <RawOutputModal
                isOpen={isRawOutputModalOpen}
                onClose={() => setIsRawOutputModalOpen(false)}
                logHistory={activeApplet.fullLogHistory}
            />
            <LogsModal
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                logHistory={activeApplet.fullLogHistory}
            />
            <FileOverlay
                isOpen={isFileOverlayOpen}
                onClose={() => setIsFileOverlayOpen(false)}
                htmlCode={activeApplet.html}
                cssCode={activeApplet.css}
                jsCode={activeApplet.js}
            />
            <Toast message={toastMessage} onClose={() => setToastMessage(null)} type={toastType} />
            <div className="relative flex flex-1 overflow-hidden">
                <ChatPanel 
                    chatHistory={activeApplet.chatHistory}
                    isLoading={isLoading}
                    currentStatus={currentStatus}
                    onSendMessage={handleSendMessage}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                    applets={applets}
                    activeAppletId={activeAppletId}
                    onSelectApplet={setActiveAppletId}
                    onCreateApplet={handleCreateApplet}
                    onOpenFiles={() => setIsFileOverlayOpen(true)}
                    onOpenSettings={() => setIsSettingsModalOpen(true)}
                />
                <MainContent
                    htmlCode={activeApplet.html}
                    cssCode={activeApplet.css}
                    jsCode={activeApplet.js}
                    onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
                />
            </div>
        </div>
    );
};

export default App;
