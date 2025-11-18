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
  const getSpacingValue = (value: keyof typeof SPACING | number | undefined) => {
    if (value === undefined) return undefined;
    return typeof value === 'number' ? `${value}px` : `${SPACING[value]}px`;
  };

  const gridTemplateColumns = autoFit
    ? `repeat(auto-fit, minmax(${minColumnWidth}px, 1fr))`
    : columns
    ? `repeat(${columns}, 1fr)`
    : undefined;

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns,
    gap: getSpacingValue(gap),
    columnGap: getSpacingValue(columnGap),
    rowGap: getSpacingValue(rowGap),
    ...style,
  };

  return (
    <div style={gridStyle} className={className}>
      {children}
    </div>
  );
};
