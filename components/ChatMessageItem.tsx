import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, Command } from '../types';
import { Sender } from '../types';
import { BotIcon, SystemIcon, ReasoningIcon, ChevronDownIcon, ToolIcon } from './icons';

interface ChatMessageItemProps {
  msg: ChatMessage;
}

const formatCommand = (cmd: Command): string => {
    switch (cmd.name) {
        case 'edit': return `edit(${cmd.fileName})`;
        case 'inline_edit': return `inline_edit(${cmd.fileName}, ${cmd.lineNumber})`;
        case 'title': return `title("${cmd.content}")`;
        case 'task_completed': return `task_completed()`;
        default: return cmd.name;
    }
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg }) => {
    const [isReasoningCollapsed, setIsReasoningCollapsed] = useState(true);
    const [isToolsCollapsed, setIsToolsCollapsed] = useState(true);

    const isUser = msg.sender === Sender.User;
    const isSystem = msg.sender === Sender.System;
    const isReasoning = msg.sender === Sender.Reasoning;
    const hasTools = msg.commands && msg.commands.length > 0;

    if (isSystem) {
        if (msg.message === 'Continuing work...') {
            return (
                 <div className="flex items-center space-x-3 my-4 text-xs text-gray-500 dark:text-gray-400 italic chat-message-enter">
                    <div className="flex-grow h-px bg-gray-200 dark:bg-[#333]"></div>
                    <span className="flex-shrink-0">AI continuing work</span>
                    <div className="flex-grow h-px bg-gray-200 dark:bg-[#333]"></div>
                </div>
            )
        }
        return (
            <div className="flex items-start space-x-3 my-4 text-xs text-gray-500 dark:text-gray-400 chat-message-enter">
                <SystemIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap font-sans text-xs">{msg.message}</pre>
            </div>
        )
    }

    if (isReasoning) {
        if (!msg.message.trim()) return null;

        return (
            <div className="my-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-lg border border-gray-200 dark:border-[#444] chat-message-enter overflow-hidden">
                <button
                    onClick={() => setIsReasoningCollapsed(!isReasoningCollapsed)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                    aria-expanded={!isReasoningCollapsed}
                >
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                        <ReasoningIcon className="w-4 h-4" />
                        <span>Reasoning</span>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${!isReasoningCollapsed ? 'rotate-180' : ''}`} />
                </button>
                {!isReasoningCollapsed && (
                     <div className="p-3 border-t border-gray-200 dark:border-[#444]">
                        <div className="markdown-content text-sm text-gray-700 dark:text-gray-300">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
                        </div>
                     </div>
                )}
            </div>
        )
    }

    return (
        <div className={`flex items-start space-x-3 my-4 chat-message-enter ${isUser ? 'justify-end' : ''}`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333] flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-gray-400" /></div>}
            <div className={`p-3 rounded-lg max-w-lg ${isUser ? 'bg-gray-200 dark:bg-[#333]' : 'bg-gray-100 dark:bg-[#222]'} ${!isUser ? 'w-full' : ''}`}>
                 {isUser ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans">{msg.message}</pre>
                ) : (
                    <>
                        <div className="markdown-content text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message || '...'}</ReactMarkdown>
                        </div>
                        {hasTools && (
                            <div className="mt-3 border-t border-gray-200 dark:border-[#444] pt-2">
                                <button
                                    onClick={() => setIsToolsCollapsed(!isToolsCollapsed)}
                                    className="w-full flex items-center justify-between text-left hover:bg-gray-200/50 dark:hover:bg-black/20 p-1 rounded-sm transition-colors"
                                    aria-expanded={!isToolsCollapsed}
                                >
                                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                                        <ToolIcon className="w-4 h-4" />
                                        <span>Tools Used ({msg.commands.length})</span>
                                    </div>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-200 text-gray-500 dark:text-gray-400 ${!isToolsCollapsed ? 'rotate-180' : ''}`} />
                                </button>
                                {!isToolsCollapsed && (
                                    <div className="mt-2 text-xs font-mono bg-gray-200 dark:bg-[#333] p-2 rounded whitespace-pre-wrap space-y-1">
                                        {msg.commands.map((cmd, i) => (
                                            <div key={i}>{formatCommand(cmd)}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatMessageItem;