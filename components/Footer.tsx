
import React from 'react';

interface FooterProps {
    isLoading: boolean;
    currentStatus: string;
}

const Footer: React.FC<FooterProps> = ({ isLoading, currentStatus }) => {
    return (
        <footer className="w-full bg-gray-100 dark:bg-[#222] p-2 rounded-md border border-gray-200 dark:border-[#333] text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span>Status</span>
                    <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
                        <span>{isLoading ? currentStatus : 'Ready'}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
