import React from 'react';

interface StackProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  spacing?: keyof typeof SPACING | number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  style = {},
  className = '',
}) => {
  const spacingClass =
    typeof spacing === 'number'
      ? ''
      : {
          xs: 'gap-1',
          sm: 'gap-2',
          md: 'gap-4',
          lg: 'gap-6',
          xl: 'gap-8',
          xxl: 'gap-12',
          xxxl: 'gap-16',
        }[spacing];

  const spacingStyle = typeof spacing === 'number' ? { gap: `${spacing}px` } : {};

  const alignItems = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[align];

  const justifyContent = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    'space-between': 'justify-between',
    'space-around': 'justify-around',
    'space-evenly': 'justify-evenly',
  }[justify];

  return (
    <div
      style={{ ...spacingStyle, ...style }}
      className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} ${spacingClass} ${alignItems} ${justifyContent} ${
        wrap ? 'flex-wrap' : 'flex-nowrap'
      } ${className}`}
    >
      {children}
    </div>
  );
};
