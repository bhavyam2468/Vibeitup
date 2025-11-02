import React from 'react';

interface FooterProps {
    isLoading: boolean;
    currentStatus: string;
    onViewAppClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ isLoading, currentStatus, onViewAppClick }) => {
    
    const statusText = isLoading ? currentStatus : 'Ready';

    return (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></span>
                <span className="flex-1 truncate">{statusText}</span>
            </div>
            {onViewAppClick && (
                <button 
                    onClick={onViewAppClick} 
                    className="ml-4 text-right text-blue-500 hover:underline md:hidden"
                    aria-label="View application"
                >
                    view application
                </button>
            )}
        </div>
    );
};

export default Footer;