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

    useEffect(() => {
        if (isOpen) {
            // Reset to default when opening
            setWidth(PRESETS.desktop.width);
            setHeight(PRESETS.desktop.height);
            setScrollPercent(0);
            setActivePreset('desktop');
        }
    }, [isOpen]);

    if (!isOpen) {
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
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="bg-[#1e1e1e] rounded-lg shadow-xl p-6 border border-[#444] w-full max-w-md text-white"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Configure Screensnip</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-full">
                        <CloseIcon />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Presets</label>
                        <div className="flex space-x-2">
                            {Object.entries(PRESETS).map(([key, { name }]) => (
                                <button
                                    key={key}
                                    onClick={() => handlePresetClick(key as PresetKey)}
                                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                        activePreset === key ? 'bg-gray-500 text-white' : 'bg-[#333] hover:bg-[#444]'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Custom Dimensions</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="number"
                                placeholder="Width"
                                value={width}
                                onChange={(e) => { setWidth(parseInt(e.target.value, 10)); setActivePreset(null as any); }}
                                className="w-full bg-[#2a2a2a] border border-[#444] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                             <span className="text-gray-400">x</span>
                            <input
                                type="number"
                                placeholder="Height"
                                value={height}
                                onChange={(e) => { setHeight(parseInt(e.target.value, 10)); setActivePreset(null as any); }}
                                className="w-full bg-[#2a2a2a] border border-[#444] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="scroll" className="text-sm font-medium text-gray-300 mb-2 block">Scroll Position ({scrollPercent}%)</label>
                        <input
                            id="scroll"
                            type="range"
                            min="0"
                            max="100"
                            value={scrollPercent}
                            onChange={(e) => setScrollPercent(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#333] hover:bg-[#444] rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
                    >
                        Capture
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SnipModal;
