import React from 'react';
import { SPACING } from '../../styles/tokens';

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: keyof typeof SPACING | number;
  columnGap?: keyof typeof SPACING | number;
  rowGap?: keyof typeof SPACING | number;
  autoFit?: boolean;
  minColumnWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns,
  gap,
  columnGap,
  rowGap,
  autoFit = false,
  minColumnWidth = 200,
  style = {},
  className = '',
}) => {
  const spacingClassMap: Record<keyof typeof SPACING, string> = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    xxl: '12',
    xxxl: '16',
  };

  const getSpacingClass = (value: keyof typeof SPACING | number | undefined, axis?: 'x' | 'y') => {
    if (value === undefined || typeof value === 'number') return '';
    const prefix = axis === 'x' ? 'gap-x-' : axis === 'y' ? 'gap-y-' : 'gap-';
    return `${prefix}${spacingClassMap[value]}`;
  };

  const gridTemplateColumns = autoFit
    ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`
    : columns
    ? `repeat(${columns}, 1fr)`
    : undefined;

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns,
    ...(typeof gap === 'number' ? { gap: `${gap}px` } : {}),
    ...(typeof columnGap === 'number' ? { columnGap: `${columnGap}px` } : {}),
    ...(typeof rowGap === 'number' ? { rowGap: `${rowGap}px` } : {}),
    ...style,
  };

  return (
    <div
      style={gridStyle}
      className={`grid ${getSpacingClass(gap)} ${getSpacingClass(columnGap, 'x')} ${getSpacingClass(
        rowGap,
        'y',
      )} ${className}`}
    >
      {children}
    </div>
  );
};
