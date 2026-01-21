import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  disabled,
  loading = false,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          <span style={{ opacity: 0 }}>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
