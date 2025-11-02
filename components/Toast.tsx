import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface ToastProps {
    message: string | null;
    onClose: () => void;
    duration?: number;
    type?: 'info' | 'warning' | 'error'; // New prop for toast type
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 6000, type = 'info' }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration]);

    const handleClose = () => {
        setIsVisible(false);
        // Allow time for fade-out animation before calling onClose
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!message && !isVisible) {
        return null;
    }

    const typeClasses = {
        info: {
            bg: 'bg-blue-100 dark:bg-blue-900',
            border: 'border-blue-500 dark:border-blue-400',
            text: 'text-blue-800 dark:text-blue-200',
            hoverBg: 'hover:bg-blue-200 dark:hover:bg-blue-800',
        },
        warning: {
            bg: 'bg-yellow-100 dark:bg-yellow-900',
            border: 'border-yellow-500 dark:border-yellow-400',
            text: 'text-yellow-800 dark:text-yellow-200',
            hoverBg: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',
        },
        error: {
            bg: 'bg-red-100 dark:bg-red-900',
            border: 'border-red-500 dark:border-red-400',
            text: 'text-red-800 dark:text-red-200',
            hoverBg: 'hover:bg-red-200 dark:hover:bg-red-800',
        },
    };

    const currentClasses = typeClasses[type];

    return (
        <div 
            className={`fixed bottom-5 right-5 z-50 transform transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
            role="alert"
            aria-live="assertive"
        >
            <div className={`${currentClasses.bg} border-l-4 ${currentClasses.border} ${currentClasses.text} p-4 rounded-md shadow-lg flex items-start max-w-sm`}>
                <div className="flex-grow">
                    <p className="font-bold">
                        {type === 'info' && 'Info!'}
                        {type === 'warning' && 'Heads up!'}
                        {type === 'error' && 'Error!'}
                    </p>
                    <p className="text-sm">{message}</p>
                </div>
                <button onClick={handleClose} className={`ml-4 p-1 rounded-full ${currentClasses.hoverBg} transition-colors`}>
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;