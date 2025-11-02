import React, { useState, useEffect, useRef } from 'react';
import PreviewPanel from './PreviewPanel';
import { MenuIcon } from './icons';

interface MainContentProps {
    htmlCode: string;
    cssCode: string;
    jsCode: string;
    onToggleSidebar: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ 
    htmlCode, 
    cssCode, 
    jsCode, 
    onToggleSidebar,
}) => {
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        let isMobile = window.innerWidth < 768;

        const handleInteraction = () => {
            setControlsVisible(true);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            if (isMobile) {
                controlsTimeoutRef.current = window.setTimeout(() => {
                    setControlsVisible(false);
                }, 3000);
            }
        };
        
        const handleResize = () => {
             isMobile = window.innerWidth < 768;
             if (!isMobile) {
                 setControlsVisible(true);
                 if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
             }
        }
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        handleInteraction(); // Initial call

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    return (
        <main className="flex-1 flex flex-col relative">
             <button 
                onClick={onToggleSidebar} 
                className={`
                    absolute top-4 left-4 z-30 md:hidden
                    p-3 bg-gray-800/50 text-white backdrop-blur-sm rounded-full shadow-lg hover:bg-gray-800/80 
                    transition-opacity duration-500
                    ${controlsVisible ? 'opacity-100' : 'opacity-40'}
                `}
                onMouseEnter={() => setControlsVisible(true)}
                aria-label="Toggle chat panel"
            >
                <MenuIcon className="w-5 h-5" />
            </button>

            <div className="flex-1 bg-white dark:bg-[#111111] overflow-auto">
                <PreviewPanel 
                    htmlCode={htmlCode} 
                    cssCode={cssCode} 
                    jsCode={jsCode}
                />
            </div>
        </main>
    );
};

export default MainContent;