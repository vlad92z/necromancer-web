import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  disabled = false,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#a855f7] text-white hover:bg-[#c084fc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300',
    secondary:
      'border border-white/10 bg-[#1a1032] text-white hover:border-white/30 hover:bg-[#231542] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300',
    danger:
      'bg-[#fb7185] text-white hover:bg-[#f43f5e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300',
    success:
      'bg-[#4ade80] text-[#0c051c] hover:bg-[#22c55e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300',
    ghost:
      'bg-transparent text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300',
  }[variant];

  const widthClass = fullWidth ? 'w-full' : '';
  const stateClasses = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-md font-bold transition duration-150 ease-out';

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${stateClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
