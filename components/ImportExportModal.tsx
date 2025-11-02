import React, { useRef, useState, useEffect } from 'react';
import { CloseIcon, DownloadIcon, UploadIcon } from './icons';

interface ImportExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: () => Promise<void>;
    onImport: (file: File) => Promise<void>;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose, onExport, onImport }) => {
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
        } else {
            const timer = setTimeout(() => setIsRendered(false), 300); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleImportClick = () => {
        if (isProcessing) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            await onImport(file);
            setIsProcessing(false);
        }
        if (e.target) e.target.value = ''; // Reset file input
    };

    const handleExportClick = async () => {
        setIsProcessing(true);
        await onExport();
        setIsProcessing(false);
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
                className={`transform transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} bg-white dark:bg-[#1e1e1e] rounded-lg shadow-xl p-6 border border-gray-200 dark:border-[#444] w-full max-w-lg text-gray-800 dark:text-white`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Import / Export Applet</h2>
                    <button onClick={onClose} className="p-1.5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-md transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-md border border-gray-200 dark:border-[#333]">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-[#333] rounded-full">
                                <DownloadIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Export as .zip</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
                                    Download a zip archive containing the `index.html`, `styles.css`, and `script.js` files for the current applet.
                                </p>
                                <button
                                    onClick={handleExportClick}
                                    disabled={isProcessing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isProcessing ? 'Processing...' : 'Export Applet'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-md border border-gray-200 dark:border-[#333]">
                        <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-[#333] rounded-full">
                                <UploadIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Import from .zip</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
                                    Upload a zip archive to replace the current applet's code. The zip must contain `index.html`, `styles.css`, and `script.js`.
                                </p>
                                <button
                                    onClick={handleImportClick}
                                    disabled={isProcessing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                                >
                                     {isProcessing ? 'Processing...' : 'Import Applet'}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".zip"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] rounded-md transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportExportModal;