import React from 'react';

interface StatusCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

const StatusCheckbox: React.FC<StatusCheckboxProps> = ({ checked, onChange, label = 'Active' }) => {
  return (
    <div className="flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded bg-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
      />
      <label className="ml-2 block text-sm text-gray-700">{label}</label>
    </div>
  );
};

export default StatusCheckbox;
