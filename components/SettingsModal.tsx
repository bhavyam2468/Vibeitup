

import React, { useState, useEffect } from 'react';
import type { ModelId } from '../types';
import { CloseIcon } from './icons';
import { getClientApiKey, setClientApiKey } from '../utils/storage';
import AIControlPanel from './AIControlPanel'; // Import the AIControlPanel

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResetApplet: () => void;
    onOpenRawOutput: () => void;
    onOpenLogs: () => void;
    selectedModel: ModelId;
    onModelChange: (modelId: ModelId) => void;
    setToastMessage: (message: string | null, type?: 'info' | 'warning' | 'error') => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    onResetApplet,
    onOpenRawOutput,
    onOpenLogs,
    selectedModel,
    onModelChange,
    setToastMessage,
}) => {
    const [isRendered, setIsRendered] = useState(isOpen);
    const [clientKey, setClientKey] = useState(getClientApiKey() || '');
    const [isConfirmingReset, setIsConfirmingReset] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setClientKey(getClientApiKey() || '');
            setIsConfirmingReset(false);
        } else {
            const timer = setTimeout(() => setIsRendered(false), 300); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSaveKey = () => {
        setClientApiKey(clientKey);
        onClose();
    };

    const handleConfirmReset = () => {
        onResetApplet();
        onClose();
    };

    const handleModelChange = (modelId: ModelId) => {
        onModelChange(modelId);
        if (modelId !== 'gemini-2.5-pro') {
            setToastMessage("For stable edits use Pro, lighter models available for errors, bugs, and queries.", 'info');
        } else {
            setToastMessage(null); // Clear toast if Pro is selected
        }
    };
    
    if (!isRendered) {
        return null;
    }

    return (
        <div 
            className={`fixed inset-0 flex items-center justify-center z-50 transition-colors duration-300 ${isOpen ? 'bg-black bg-opacity-70' : 'bg-transparent'}`}
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div 
                className={`transform transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl p-6 border border-gray-200 dark:border-[#444] w-full max-w-md text-gray-800 dark:text-white`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Settings</h2>
                    <button onClick={onClose} className="p-1.5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-md transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label htmlFor="api-key-input" className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">
                            Your Gemini API Key (Optional)
                        </label>
                        <input
                            id="api-key-input"
                            type="password"
                            value={clientKey}
                            onChange={(e) => setClientKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                        />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            The app uses a developer key by default, which may have rate limits. Providing your own key is recommended for better performance. Your key is saved only in your browser's local storage.
                        </p>
                    </div>

                    <div>
                        <AIControlPanel
                            selectedModel={selectedModel}
                            onModelChange={handleModelChange}
                        />
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Debugging</h3>
                        <div className="flex flex-col space-y-2">
                             <button
                                onClick={() => { onOpenRawOutput(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2b2b2b] hover:bg-gray-200 dark:hover:bg-[#333] rounded-md transition-colors"
                            >
                                View Raw AI Output
                            </button>
                             <button
                                onClick={() => { onOpenLogs(); onClose(); }}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2b2b2b] hover:bg-gray-200 dark:hover:bg-[#333] rounded-md transition-colors"
                            >
                                View Tool Logs
                            </button>
                        </div>
                    </div>

                     <div className="border-t border-gray-200 dark:border-[#333] pt-4">
                        {isConfirmingReset ? (
                            <div>
                                <p className="text-sm text-center text-yellow-600 dark:text-yellow-400 mb-3">
                                    Are you sure? This action is permanent.
                                </p>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => setIsConfirmingReset(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] rounded-md transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmReset}
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                    >
                                        Confirm Reset
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Current Applet
                                </label>
                                <button
                                    onClick={() => setIsConfirmingReset(true)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                >
                                    Reset Applet
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveKey}
                        className="px-5 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;