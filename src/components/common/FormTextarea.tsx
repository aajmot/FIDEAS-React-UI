import React from 'react';

interface FormTextareaProps {
  // value can be null/undefined at runtime; coerce to empty string when rendering
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  name?: string;
  required?: boolean;
}

const FormTextarea: React.FC<FormTextareaProps> = ({
  value,
  onChange,
  placeholder = '',
  rows = 1,
  className = '',
  name,
  required = false
}) => {
  const checkScroll = (target: HTMLTextAreaElement) => {
    if (target.scrollHeight <= target.clientHeight) {
      target.style.overflowY = 'hidden';
    } else {
      target.style.overflowY = 'auto';
    }
  };

  return (
    <div className="relative">
      <textarea
        name={name}
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value);
          checkScroll(e.target);
        }}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`w-full border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary ${className}`}
      />
      <div className="absolute right-1.5 bottom-1.5 pointer-events-none text-gray-400" style={{ zIndex: 1 }}>
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="10" y1="4" x2="4" y2="10" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="7" x2="7" y2="10" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
};

export default FormTextarea;
