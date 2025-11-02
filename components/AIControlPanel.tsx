import React from 'react';
import type { ModelId } from '../types';
import { MODELS } from '../constants';
import { ChevronDownIcon } from './icons';

interface AIControlPanelProps {
  selectedModel: ModelId;
  onModelChange: (modelId: ModelId) => void;
  // `disabled` prop was removed as model selection is now handled within SettingsModal where it's always enabled.
}

const Selector: React.FC<{
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: {id: string; name: string}[];
}> = ({ label, value, onChange, options }) => (
    <div className="flex-1">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {label}
        </label>
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="w-full appearance-none bg-gray-100 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-colors"
            >
                {options.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none text-gray-400" />
        </div>
    </div>
);

const AIControlPanel: React.FC<AIControlPanelProps> = ({
    selectedModel,
    onModelChange,
}) => {
    return (
        <div>
            <Selector
                label="Model"
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value as ModelId)}
                options={MODELS}
            />
        </div>
    );
};

export default AIControlPanel;