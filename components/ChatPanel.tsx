import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';
import { Sender } from '../types';
import { BotIcon, SendIcon, SystemIcon, ReasoningIcon, CloseIcon, PaperclipIcon, ImageIcon, FileTextIcon, CropIcon } from './icons';

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendMessage: (message: string) => void;
  onOpenSnipModal: (prompt: string) => void;
}

const ChatMessageItem: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
    const isUser = msg.sender === Sender.User;
    const isSystem = msg.sender === Sender.System;
    const isReasoning = msg.sender === Sender.Reasoning;

    if (isSystem) {
        return (
            <div className="flex items-center space-x-3 my-4 text-xs text-gray-400 italic">
                <SystemIcon className="w-4 h-4 flex-shrink-0" />
                <p>{msg.message}</p>
            </div>
        )
    }

    if (isReasoning) {
        return (
            <div className="my-4 p-3 bg-[#2a2a2a] rounded-lg border border-[#444]">
                <div className="flex items-center space-x-2 mb-2 text-xs text-gray-300 font-semibold">
                    <ReasoningIcon className="w-4 h-4" />
                    <span>Reasoning</span>
                </div>
                <div className="markdown-content text-sm text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message || '...'}</ReactMarkdown>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex items-start space-x-3 my-4 ${isUser ? 'justify-end' : ''}`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center flex-shrink-0"><BotIcon/></div>}
            <div className={`p-3 rounded-lg max-w-lg ${isUser ? 'bg-[#333]' : 'bg-[#222]'}`}>
                 {isUser ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans">{msg.message}</pre>
                ) : (
                    <div className="markdown-content text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.message}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

const ChatPanel: React.FC<ChatPanelProps> = ({ chatHistory, isLoading, onSendMessage, onOpenSnipModal, isOpen, setIsOpen }) => {
  const [input, setInput] = useState('');
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const handleOpenSnip = () => {
    onOpenSnipModal(input);
    setInput('');
    setIsAttachmentMenuOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentButtonRef.current && !attachmentButtonRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <aside 
      className={`
        absolute top-0 left-0 h-full z-20
        w-full max-w-md
        bg-[#1a1a1a] flex flex-col p-4 border-r border-[#333]
        transform transition-transform duration-300 ease-in-out
        md:static md:w-[450px] md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 border-b border-[#333] pb-2">
            <h1 className="text-xl font-bold">Vibe Coder</h1>
            <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white">
              <CloseIcon />
            </button>
          </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {chatHistory.map((msg, index) => (
            <ChatMessageItem key={index} msg={msg} />
          ))}
          {isLoading && chatHistory[chatHistory.length - 1]?.sender !== Sender.Model && (
            <div className="flex items-start space-x-3 my-4">
                <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center flex-shrink-0"><BotIcon/></div>
                <div className="p-3 rounded-lg bg-[#222]">
                    <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="mt-4 relative">
          {isAttachmentMenuOpen && (
             <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#333] rounded-lg shadow-lg py-2">
                <button disabled className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed">
                  <ImageIcon className="mr-3" /> Image
                </button>
                <button disabled className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed">
                  <FileTextIcon className="mr-3" /> Document
                </button>
                <button onClick={handleOpenSnip} className="flex items-center w-full px-4 py-2 text-left text-sm text-white hover:bg-[#444]">
                  <CropIcon className="mr-3" /> Screensnip
                </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <button
                ref={attachmentButtonRef}
                type="button"
                onClick={() => setIsAttachmentMenuOpen(prev => !prev)}
                disabled={isLoading}
                className="bg-[#333] hover:bg-[#444] disabled:bg-[#222] disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
              >
              <PaperclipIcon />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the UI you want to build..."
              disabled={isLoading}
              className="flex-1 bg-[#222] border border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#333] hover:bg-[#444] disabled:bg-[#222] disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};

export default ChatPanel;