import React from 'react';

interface FooterProps {
    isLoading: boolean;
    currentStatus: string;
}

const Footer: React.FC<FooterProps> = ({ isLoading, currentStatus }) => {
    return (
        <footer className="w-full bg-[#1a1a1a] p-3 border-t border-[#333] text-xs text-gray-400">
            <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <span>Status</span>
                    <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
                        <span>{isLoading ? currentStatus : 'Ready'}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span>Tokens</span>
                    <span>--</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
