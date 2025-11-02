import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Applet } from '../types';
import { Sender } from '../types';
// FIX: Import CloseIcon to be used for removing uploaded files.
import { SendIcon, PaperclipIcon, ImageIcon, FileTextIcon, PlusIcon, ChevronDownIcon, FilesIcon, SettingsIcon, CloseIcon } from './icons';
import ChatMessageItem from './ChatMessageItem';
import { BotIcon } from './icons';
import Footer from './Footer';

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  isLoading: boolean;
  currentStatus: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendMessage: (message: string, files: {file: File, previewUrl: string}[]) => void;
  applets: Applet[];
  activeAppletId: string;
  onSelectApplet: (id: string) => void;
  onCreateApplet: () => void;
  onOpenFiles: () => void;
  onOpenSettings: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  chatHistory,
  isLoading,
  currentStatus,
  onSendMessage,
  isOpen,
  setIsOpen,
  applets,
  activeAppletId,
  onSelectApplet,
  onCreateApplet,
  onOpenFiles,
  onOpenSettings,
}) => {
  const [input, setInput] = useState('');
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isAppletMenuOpen, setIsAppletMenuOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{file: File, previewUrl: string}[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appletMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || uploadedFiles.length > 0) && !isLoading) {
      onSendMessage(input, uploadedFiles);
      setInput('');
      setUploadedFiles([]);
    }
  };
  
  const handleAttachmentClick = (type: 'image' | 'document') => {
    setIsAttachmentMenuOpen(false);
    // Both image and document attachments will now trigger the file input.
    // The `accept` attribute on the input will handle file type filtering.
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
        const newFiles = Array.from(files).map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    if (e.target) {
        e.target.value = ''; // Clear the input so the same file can be selected again
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => {
        const newFiles = [...prev];
        const [removed] = newFiles.splice(index, 1);
        URL.revokeObjectURL(removed.previewUrl); // Clean up the object URL
        return newFiles;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachmentButtonRef.current && !attachmentButtonRef.current.contains(event.target as Node) &&
        (!attachmentMenuRef.current || !attachmentMenuRef.current.contains(event.target as Node))
      ) {
        setIsAttachmentMenuOpen(false);
      }
      if (appletMenuRef.current && !appletMenuRef.current.contains(event.target as Node)) {
        setIsAppletMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        uploadedFiles.forEach(file => URL.revokeObjectURL(file.previewUrl)); // Cleanup on unmount
    };
  }, [uploadedFiles]); // Added uploadedFiles to dependency array for cleanup

  const activeAppletName = applets.find(a => a.id === activeAppletId)?.name || '...';

  return (
    <aside 
      className={`
        absolute top-0 left-0 h-full z-20
        w-full max-w-md
        bg-gray-50 dark:bg-[#1a1a1a] flex flex-col p-4 border-r border-gray-200 dark:border-[#333]
        transform transition-transform duration-300 ease-in-out
        md:static md:w-[450px] md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-[#333]">
              <h1 className="text-lg font-bold">Quick Apps</h1>
              <div className="flex items-center gap-2">
                  <button onClick={onOpenFiles} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-md transition-colors" aria-label="View files">
                      <FilesIcon className="w-5 h-5" />
                  </button>
                  <button onClick={onOpenSettings} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-md transition-colors" aria-label="Open settings">
                      <SettingsIcon className="w-5 h-5" />
                  </button>
              </div>
          </div>

          <div ref={appletMenuRef} className="relative my-4">
              <button onClick={() => setIsAppletMenuOpen(prev => !prev)} className="w-full flex justify-between items-center bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors">
                  <span>{activeAppletName}</span>
                  <ChevronDownIcon className={`w-5 h-5 transition-transform ${isAppletMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAppletMenuOpen && (
                  <div className="absolute top-full mt-1 w-full bg-gray-50 dark:bg-[#2a2a2a] rounded-md shadow-lg border border-gray-200 dark:border-[#444] z-10 py-1">
                      {applets.map(applet => (
                          <button key={applet.id} onClick={() => { onSelectApplet(applet.id); setIsAppletMenuOpen(false); }} className={`block w-full text-left px-3 py-2 text-sm ${activeAppletId === applet.id ? 'bg-gray-200 dark:bg-[#444]' : 'hover:bg-gray-200 dark:hover:bg-[#444]'}`}>
                              {applet.name}
                          </button>
                      ))}
                      <div className="border-t border-gray-200 dark:border-[#444] my-1"></div>
                      <button onClick={onCreateApplet} className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-[#444]">
                          <PlusIcon className="w-4 h-4 mr-2" /> New Applet
                      </button>
                  </div>
              )}
          </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {chatHistory.map((msg, index) => (
            <ChatMessageItem key={index} msg={msg} />
          ))}
          {isLoading && chatHistory[chatHistory.length - 1]?.sender !== Sender.Model && (
            <div className="flex items-start space-x-3 my-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#333] flex items-center justify-center flex-shrink-0"><BotIcon className="w-5 h-5 text-gray-400" /></div>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-[#222]">
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
        
        <div className="py-2">
            <Footer isLoading={isLoading} currentStatus={currentStatus} />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-[#333]">
            {uploadedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-[#222] rounded-md border border-gray-200 dark:border-[#333]">
                    {uploadedFiles.map((file, index) => (
                        <div key={file.previewUrl} className="relative group w-20 h-20 rounded-md overflow-hidden border border-gray-300 dark:border-[#444] flex-shrink-0">
                            {file.file.type.startsWith('image/') ? (
                                <img src={file.previewUrl} alt={file.file.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 dark:bg-[#333] text-gray-600 dark:text-gray-300 p-1">
                                    <FileTextIcon className="w-8 h-8" />
                                    <span className="text-xs text-center mt-1 truncate w-full px-1">{file.file.name}</span>
                                </div>
                            )}
                            <button
                                onClick={() => handleRemoveFile(index)}
                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                                aria-label={`Remove ${file.file.name}`}
                            >
                                <CloseIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="relative">
              {isAttachmentMenuOpen && (
                 <div ref={attachmentMenuRef} className="absolute bottom-full left-0 mb-2 w-48 bg-gray-100 dark:bg-[#333] rounded-lg shadow-lg py-2 border border-gray-200 dark:border-[#444]">
                    <button onClick={() => handleAttachmentClick('image')} className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-[#444] transition-colors">
                      <ImageIcon className="w-4 h-4 mr-3" /> Image
                    </button>
                    <button onClick={() => handleAttachmentClick('document')} className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-[#444] transition-colors">
                      <FileTextIcon className="w-4 h-4 mr-3" /> Document
                    </button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <button
                    ref={attachmentButtonRef}
                    type="button"
                    onClick={() => setIsAttachmentMenuOpen(prev => !prev)}
                    disabled={isLoading}
                    className="p-2.5 flex items-center justify-center bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] disabled:bg-gray-100 dark:disabled:bg-[#222] disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                  <PaperclipIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Build a pomodoro timer..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                  className="p-2.5 flex items-center justify-center bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] disabled:bg-gray-100 dark:disabled:bg-[#222] disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  <SendIcon className="w-5 h-5" />
                </button>
              </form>
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*, .pdf, .doc, .docx, .txt" // Allow images and common document types
                multiple // Allow multiple image selection
                className="hidden"
              />
            </div>
        </div>
      </div>
    </aside>
  );
};

export default ChatPanel;