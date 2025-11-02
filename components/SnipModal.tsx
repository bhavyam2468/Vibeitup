import React, { useState, useEffect } from 'react';
import type { SnipOptions } from '../types';
import { CloseIcon } from './icons';

interface SnipModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: SnipOptions) => void;
}

const PRESETS = {
    'mobile': { name: 'Mobile', width: 375, height: 667 },
    'tablet': { name: 'Tablet', width: 768, height: 1024 },
    'desktop': { name: 'Desktop', width: 1280, height: 720 },
};
type PresetKey = keyof typeof PRESETS;

const SnipModal: React.FC<SnipModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [width, setWidth] = useState(PRESETS.desktop.width);
    const [height, setHeight] = useState(PRESETS.desktop.height);
    const [scrollPercent, setScrollPercent] = useState(0);
    const [activePreset, setActivePreset] = useState<PresetKey>('desktop');
    const [isRendered, setIsRendered] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // Reset to default when opening
            setWidth(PRESETS.desktop.width);
            setHeight(PRESETS.desktop.height);
            setScrollPercent(0);
            setActivePreset('desktop');
        } else {
             const timer = setTimeout(() => setIsRendered(false), 300); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) {
        return null;
    }

    const handlePresetClick = (key: PresetKey) => {
        setActivePreset(key);
        setWidth(PRESETS[key].width);
        setHeight(PRESETS[key].height);
    };

    const handleConfirm = () => {
        onConfirm({
            viewport: { width, height },
            scrollPercent: scrollPercent > 0 ? scrollPercent : undefined,
        });
    };

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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Configure Screensnip</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-full transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">Presets</label>
                        <div className="flex space-x-2">
                            {Object.entries(PRESETS).map(([key, { name }]) => (
                                <button
                                    key={key}
                                    onClick={() => handlePresetClick(key as PresetKey)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                        activePreset === key ? 'bg-gray-600 dark:bg-gray-500 text-white' : 'bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444]'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">Custom Dimensions</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                placeholder="Width"
                                value={width}
                                onChange={(e) => { setWidth(parseInt(e.target.value, 10)); setActivePreset(null as any); }}
                                className="w-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                             <span className="text-gray-400">x</span>
                            <input
                                type="number"
                                placeholder="Height"
                                value={height}
                                onChange={(e) => { setHeight(parseInt(e.target.value, 10)); setActivePreset(null as any); }}
                                className="w-full bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-[#444] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="scroll" className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">Scroll Position ({scrollPercent}%)</label>
                        <input
                            id="scroll"
                            type="range"
                            min="0"
                            max="100"
                            value={scrollPercent}
                            onChange={(e) => setScrollPercent(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        Capture
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SnipModal;