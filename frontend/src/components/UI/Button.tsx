import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-fin-accent';

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs font-semibold',
    lg: 'px-4 py-2 text-sm font-semibold',
  };

  const variants = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 shadow-sm',
    secondary:
      'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm',
    danger:
      'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    gold:
      'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 font-medium',
  };

  return (
    <button
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
