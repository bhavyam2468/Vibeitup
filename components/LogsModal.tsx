import React, { useState, useEffect } from 'react';
import type { TurnLog, LogEntry } from '../types';
import { CloseIcon, DownloadIcon } from './icons';

interface LogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    logHistory: TurnLog[];
}

const LogEntryItem: React.FC<{ log: LogEntry }> = ({ log }) => {
    const isSuccess = log.status === 'success';
    return (
        <div className="p-3 bg-gray-50 dark:bg-[#2f2f2f] rounded-md border-l-4 dark:border-[#555] border-gray-300">
            <div className="flex items-center justify-between">
                <p className="font-mono text-sm font-semibold">{log.command}</p>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isSuccess ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                    {log.status.toUpperCase()}
                </span>
            </div>
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">{log.message}</pre>
        </div>
    );
};


const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose, logHistory }) => {
    const [isRendered, setIsRendered] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        } else {
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleDownload = () => {
        if (logHistory.length === 0) return;
        const dataStr = JSON.stringify(logHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tool-execution-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
                className={`transform transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl border border-gray-200 dark:border-[#444] w-full max-w-4xl h-[80vh] flex flex-col text-gray-800 dark:text-white`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-[#444]">
                    <h2 className="text-xl font-bold">Tool Execution Logs</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleDownload}
                            disabled={logHistory.length === 0}
                            className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2b2b2b] hover:bg-gray-200 dark:hover:bg-[#333] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Download as JSON
                        </button>
                        <button onClick={onClose} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-[#111111]">
                     {logHistory.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No AI turns have been completed yet.</p>
                    ) : (
                        <div className="space-y-6">
                            {[...logHistory].reverse().map((turn) => (
                                <div key={turn.turnNumber}>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                        Turn {turn.turnNumber}
                                    </h3>
                                    <div className="space-y-2">
                                        {turn.logs.map((log, index) => (
                                            <LogEntryItem key={index} log={log} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogsModal;