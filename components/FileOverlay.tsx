
import React, { useState, useEffect } from 'react';
import CodeView from './CodeView';
import { CloseIcon } from './icons';

interface FileOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    htmlCode: string;
    cssCode: string;
    jsCode: string;
}

type Tab = 'html' | 'css' | 'js';

const FileOverlay: React.FC<FileOverlayProps> = ({ isOpen, onClose, htmlCode, cssCode, jsCode }) => {
    const [activeTab, setActiveTab] = useState<Tab>('html');
    const [isRendered, setIsRendered] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setActiveTab('html'); // Reset to first tab when opening
        } else {
            const timer = setTimeout(() => setIsRendered(false), 300); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) {
        return null;
    }

    const tabClasses = (tabName: Tab) => 
        `px-4 py-2 text-sm font-medium cursor-pointer border-b-2 transition-colors ${
            activeTab === tabName 
            ? 'text-white border-white' 
            : 'text-gray-400 border-transparent hover:text-white'
        }`;

    return (
        <div
            className={`fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-black/70' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={`transform transition-all duration-300 ease-in-out ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} w-[90vw] h-[90vh] bg-[#1a1a1a] rounded-lg shadow-2xl flex flex-col border border-[#333]`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-2 pl-4 border-b border-[#333] flex-shrink-0">
                    <nav className="flex space-x-2">
                        <button onClick={() => setActiveTab('html')} className={tabClasses('html')}>index.html</button>
                        <button onClick={() => setActiveTab('css')} className={tabClasses('css')}>styles.css</button>
                        <button onClick={() => setActiveTab('js')} className={tabClasses('js')}>script.js</button>
                    </nav>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-full transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto">
                    {activeTab === 'html' && <CodeView code={htmlCode} language="html" />}
                    {activeTab === 'css' && <CodeView code={cssCode} language="css" />}
                    {activeTab === 'js' && <CodeView code={jsCode} language="javascript" />}
                </div>
            </div>
        </div>
    );
};

export default FileOverlay;
