import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof SPACING | number;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style = {},
  className = '',
  onClick,
  hoverable = false,
}) => {
  const paddingClass =
    typeof padding === 'number'
      ? ''
      : {
          xs: 'p-1',
          sm: 'p-2',
          md: 'p-4',
          lg: 'p-6',
          xl: 'p-8',
          xxl: 'p-12',
          xxxl: 'p-16',
        }[padding];

  const paddingStyle = typeof padding === 'number' ? { padding: `${padding}px` } : {};

  const variantClasses = {
    default: 'bg-[#1a1032] text-white',
    elevated: 'bg-[#1a1032] text-white shadow-[0_4px_12px_rgba(0,0,0,0.45)]',
    outlined: 'bg-[#1a1032] text-white border border-white/10',
  }[variant];

  const hoverClasses = (hoverable || onClick) && !style.transform ? 'hover:-translate-y-0.5 hover:bg-[#231542]' : '';
  const cursorClass = onClick ? 'cursor-pointer' : 'cursor-default';

  return (
    <div
      style={{ ...paddingStyle, ...style }}
      className={`rounded-xl transition-all duration-150 ${paddingClass} ${variantClasses} ${hoverClasses} ${cursorClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
