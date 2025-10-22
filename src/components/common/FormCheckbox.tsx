import React from 'react';

interface FormCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

const FormCheckbox: React.FC<FormCheckboxProps> = ({ checked, onChange, label = 'Active', disabled = false }) => {
  return (
    <div className={`flex items-center h-9 px-2 py-1.5 border border-gray-300 rounded ${disabled ? 'bg-gray-100' : 'bg-white'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:cursor-not-allowed"
      />
      <label className="ml-2 block text-sm text-gray-700">{label}</label>
    </div>
  );
};

export default FormCheckbox;
