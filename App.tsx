import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Content } from '@google/genai';
import type { ChatMessage, FileName, Command, SnipOptions } from './types';
import { Sender } from './types';
import { INITIAL_HTML, INITIAL_CSS, INITIAL_JS, SYSTEM_INSTRUCTION } from './constants';
import { generateCodeStream } from './services/geminiService';
import { parseGeminiResponse } from './utils/parser';
import ChatPanel from './components/ChatPanel';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import SnipModal from './components/SnipModal';

const App: React.FC = () => {
    const [htmlCode, setHtmlCode] = useState<string>(INITIAL_HTML);
    const [cssCode, setCssCode] = useState<string>(INITIAL_CSS);
    const [jsCode, setJsCode] = useState<string>(INITIAL_JS);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [modelHistory, setModelHistory] = useState<Content[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [currentStatus, setCurrentStatus] = useState<string>('Ready');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [snipRequest, setSnipRequest] = useState<SnipOptions | null>(null);
    const [isSnipModalOpen, setIsSnipModalOpen] = useState(false);
    const [userSnipData, setUserSnipData] = useState<{ prompt: string } | null>(null);
    const recursionFlag = useRef<boolean>(false);

    const files: Record<FileName, string> = {
        'index.html': htmlCode,
        'styles.css': cssCode,
        'script.js': jsCode,
    };

    const executeFileCommands = (commands: Command[]) => {
        commands.forEach(cmd => {
            const fileSetters: Record<FileName, React.Dispatch<React.SetStateAction<string>>> = {
                'index.html': setHtmlCode,
                'styles.css': setCssCode,
                'script.js': setJsCode,
            };

            if (!cmd.fileName || !fileSetters[cmd.fileName]) return;
            const setter = fileSetters[cmd.fileName];

            switch (cmd.name) {
                case 'edit':
                    // This is handled during streaming for a better UX
                    break;
                case 'replace_lines': {
                    const startLine = cmd.startLine ? cmd.startLine - 1 : 0;
                    const endLine = cmd.endLine || startLine;
                    setter(prev => {
                        const lines = prev.split('\n');
                        const before = lines.slice(0, startLine);
                        const after = lines.slice(endLine);
                        return [...before, ...cmd.content.split('\n'), ...after].join('\n');
                    });
                    break;
                }
                case 'insert_content': {
                    const line = cmd.lineNumber ? cmd.lineNumber - 1 : 0;
                    setter(prev => {
                        const lines = prev.split('\n');
                        lines.splice(line, 0, ...cmd.content.split('\n'));
                        return lines.join('\n');
                    });
                    break;
                }
                case 'delete_lines': {
                    const startLine = cmd.startLine ? cmd.startLine - 1 : 0;
                    const endLine = cmd.endLine || startLine + 1;
                    setter(prev => {
                        const lines = prev.split('\n');
                        lines.splice(startLine, endLine - startLine);
                        return lines.join('\n');
                    });
                    break;
                }
            }
        });
    }

    const processAndRunGemini = useCallback(async (prompt: string | null, historyOverride?: Content[]) => {
        setIsLoading(true);
        setCurrentStatus('Thinking...');
        
        let currentModelHistory: Content[];

        if (historyOverride) {
            currentModelHistory = historyOverride;
        } else if (prompt) {
            setChatHistory(prev => [...prev, { sender: Sender.User, message: prompt }]);
            currentModelHistory = [...modelHistory, { role: 'user', parts: [{ text: prompt }] }];
            setModelHistory(currentModelHistory);
        } else {
             setChatHistory(prev => [...prev, { sender: Sender.System, message: 'Continuing work...' }]);
             currentModelHistory = modelHistory;
        }

        // Add placeholders for streaming responses
        setChatHistory(prev => [
            ...prev,
            { sender: Sender.Reasoning, message: '' },
            { sender: Sender.Model, message: '' }
        ]);

        const fullSystemInstruction = `
            ${SYSTEM_INSTRUCTION}

            Here is the current state of the files:

            --- START index.html ---
            ${htmlCode}
            --- END index.html ---

            --- START styles.css ---
            ${cssCode}
            --- END styles.css ---

            --- START script.js ---
            ${jsCode}
            --- END script.js ---
        `;
        
        let fullResponseText = '';
        try {
            const stream = generateCodeStream(fullSystemInstruction, currentModelHistory);

            for await (const chunk of stream) {
                fullResponseText += chunk;
                const { commands } = parseGeminiResponse(fullResponseText);
                
                const reasoningText = commands.filter(c => c.name === 'reasoning').map(c => c.content).join('\n\n');
                const chatText = commands.filter(c => c.name === 'chat').map(c => c.content).join('\n\n');
                
                const lastCommand = commands.length > 0 ? commands[commands.length - 1] : null;
                if (lastCommand) {
                    switch (lastCommand.name) {
                        case 'chat': setCurrentStatus('Chatting with user...'); break;
                        case 'reasoning': setCurrentStatus('Reasoning...'); break;
                        case 'snip': setCurrentStatus('Preparing screenshot...'); break;
                        case 'edit':
                        case 'replace_lines':
                        case 'insert_content':
                        case 'delete_lines':
                            setCurrentStatus(`Editing ${lastCommand.fileName}...`);
                            break;
                    }
                }

                setChatHistory(prev => {
                    let reasoningUpdated = false;
                    let chatUpdated = false;
                    const newHistory = [...prev].reverse().map(msg => {
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
                    return newHistory;
                });

                // Stream file content for 'edit' commands
                commands.forEach(cmd => {
                    if (cmd.name === 'edit') {
                        if (cmd.fileName === 'index.html') setHtmlCode(cmd.content);
                        if (cmd.fileName === 'styles.css') setCssCode(cmd.content);
                        if (cmd.fileName === 'script.js') setJsCode(cmd.content);
                    }
                });
            }

            const { commands, recursionExpected } = parseGeminiResponse(fullResponseText);
            
            // Execute non-streamed commands after stream is complete
            executeFileCommands(commands);
            
            if (fullResponseText.trim()) {
                setModelHistory(prev => [...prev, { role: 'model', parts: [{ text: fullResponseText }] }]);
            }

            const snipCommand = commands.find(c => c.name === 'snip');
            if (snipCommand) {
                 // Use a short timeout to ensure the DOM has been updated with any file changes
                 setTimeout(() => {
                    setSnipRequest(snipCommand.snipOptions || {});
                 }, 100);
            } else {
                 recursionFlag.current = recursionExpected;
            }

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setChatHistory(prev => [...prev, { sender: Sender.System, message: `Error: ${errorMessage}` }]);
            recursionFlag.current = false;
        } finally {
            // Clean up empty placeholder messages
            setChatHistory(prev => prev.filter(msg => msg.message.trim() !== ''));

            const snipCommand = parseGeminiResponse(fullResponseText).commands.find(c => c.name === 'snip');
            if (!recursionFlag.current && !snipCommand && !userSnipData) {
                setIsLoading(false);
                setCurrentStatus('Ready');
            }
        }
    }, [htmlCode, cssCode, jsCode, modelHistory, userSnipData]);

    useEffect(() => {
        if (isLoading && recursionFlag.current) {
            recursionFlag.current = false;
            setTimeout(() => processAndRunGemini(null), 100);
        }
    }, [isLoading, processAndRunGemini]);

    const handleOpenSnipModal = (prompt: string) => {
        setUserSnipData({ prompt });
        setIsSnipModalOpen(true);
    };

    const handleConfirmSnip = (options: SnipOptions) => {
        setSnipRequest(options);
        setIsSnipModalOpen(false);
    };

    const handleSnipComplete = async (base64Image: string) => {
        setSnipRequest(null);

        // Check if this was a user-initiated snip
        if (userSnipData) {
            setCurrentStatus('Attaching screenshot...');
            const prompt = userSnipData.prompt || "Here's a screenshot, please analyze it.";

            // Add prompt to chat history for user to see
            setChatHistory(prev => [...prev, { sender: Sender.User, message: prompt }]);
            
            const imagePart = { inlineData: { mimeType: 'image/png', data: base64Image }};
            const textPart = { text: prompt };
            const newHistory: Content[] = [...modelHistory, { role: 'user', parts: [textPart, imagePart] }];

            setUserSnipData(null); // Reset
            await processAndRunGemini(null, newHistory);

        } else { // This was an AI-initiated snip
            setCurrentStatus('Analyzing screenshot...');
            const imagePart = {
                inlineData: { mimeType: 'image/png', data: base64Image },
            };
            const textPart = {
                text: "Here is a snapshot of the current UI that I requested. Please analyze it. Are there any issues? Does it match my plan? Continue your work based on your analysis."
            };
            
            const newHistory: Content[] = [...modelHistory, { role: 'user', parts: [textPart, imagePart] }];
            setModelHistory(newHistory);
            
            await processAndRunGemini(null, newHistory);
        }
    };


    return (
        <div className="bg-[#111111] text-[#E0E0E0] h-screen flex flex-col font-sans overflow-hidden">
             <SnipModal
                isOpen={isSnipModalOpen}
                onClose={() => {
                    setIsSnipModalOpen(false);
                    setUserSnipData(null); // Clear data if cancelled
                }}
                onConfirm={handleConfirmSnip}
            />
            <div className="relative flex flex-1 overflow-hidden">
                <ChatPanel 
                    chatHistory={chatHistory}
                    isLoading={isLoading}
                    onSendMessage={(prompt) => processAndRunGemini(prompt, undefined)}
                    onOpenSnipModal={handleOpenSnipModal}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                />
                <MainContent
                    files={files}
                    htmlCode={htmlCode}
                    cssCode={cssCode}
                    jsCode={jsCode}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    snipRequest={snipRequest}
                    onSnipComplete={handleSnipComplete}
                    onSnipError={() => {
                        setSnipRequest(null);
                        setIsLoading(false);
                        setCurrentStatus('Snip failed. Ready.');
                    }}
                />
            </div>
            <Footer isLoading={isLoading} currentStatus={currentStatus} />
        </div>
    );
};

export default App;