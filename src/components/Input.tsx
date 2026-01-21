import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  multiline = false,
  rows,
  ...props
}) => {
  if (multiline) {
    const { multiline: _, rows: __, ...textareaProps } = props;
    return (
      <div className={`input-wrapper ${className}`}>
        {label && <label className="input-label">{label}</label>}
        <textarea
          className={`input input-textarea ${error ? 'input-error' : ''}`}
          rows={rows || 4}
          {...(textareaProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
        {error && <span className="input-error-text">{error}</span>}
      </div>
    );
  }

  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input className={`input ${error ? 'input-error' : ''}`} {...props} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};
