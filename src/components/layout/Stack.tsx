import React from 'react';
import { SPACING } from '../../styles/tokens';

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
  const spacingValue = typeof spacing === 'number' ? spacing : SPACING[spacing];

  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  }[align];

  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
    'space-around': 'space-around',
    'space-evenly': 'space-evenly',
  }[justify];

  const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    gap: `${spacingValue}px`,
    alignItems,
    justifyContent,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    ...style,
  };

  return (
    <div style={stackStyle} className={className}>
      {children}
    </div>
  );
};
