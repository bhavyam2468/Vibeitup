
import React, { useState, useEffect } from 'react';
import type { FileName, SnipOptions } from '../types';
import CodeView from './CodeView';
import PreviewPanel from './PreviewPanel';
import { MenuIcon } from './icons';

interface MainContentProps {
    files: Record<FileName, string>;
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    onMenuClick: () => void;
    snipRequest: SnipOptions | null;
    onSnipComplete: (base64Image: string) => void;
    onSnipError: () => void;
}

type Tab = 'preview' | 'html' | 'css' | 'js';

const MainContent: React.FC<MainContentProps> = ({ 
    files, 
    htmlCode, 
    cssCode, 
    jsCode, 
    onMenuClick,
    snipRequest,
    onSnipComplete,
    onSnipError
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('preview');

    useEffect(() => {
        if (snipRequest) {
            setActiveTab('preview');
        }
    }, [snipRequest]);

    const tabClasses = (tabName: Tab) => 
        `px-4 py-2 text-sm font-medium cursor-pointer border-b-2 transition-colors ${
            activeTab === tabName 
            ? 'text-white border-white' 
            : 'text-gray-400 border-transparent hover:text-white'
        }`;

    return (
        <main className="flex-1 flex flex-col">
            <div className="bg-[#1a1a1a] border-b border-[#333]">
                <div className="flex items-center space-x-2 px-4">
                    <button onClick={onMenuClick} className="md:hidden p-2 text-gray-400 hover:text-white">
                        <MenuIcon />
                    </button>
                    <nav className="flex space-x-2">
                        <button onClick={() => setActiveTab('preview')} className={tabClasses('preview')}>Preview</button>
                        <button onClick={() => setActiveTab('html')} className={tabClasses('html')}>index.html</button>
                        <button onClick={() => setActiveTab('css')} className={tabClasses('css')}>styles.css</button>
                        <button onClick={() => setActiveTab('js')} className={tabClasses('js')}>script.js</button>
                    </nav>
                </div>
            </div>
            <div className="flex-1 bg-[#111111] overflow-auto">
                {activeTab === 'preview' && (
                    <PreviewPanel 
                        htmlCode={htmlCode} 
                        cssCode={cssCode} 
                        jsCode={jsCode}
                        snipRequest={snipRequest}
                        onSnipComplete={onSnipComplete}
                        onSnipError={onSnipError}
                    />
                )}
                {activeTab === 'html' && <CodeView code={files['index.html']} language="html" />}
                {activeTab === 'css' && <CodeView code={files['styles.css']} language="css" />}
                {activeTab === 'js' && <CodeView code={files['script.js']} language="javascript" />}
            </div>
        </main>
    );
};

export default MainContent;