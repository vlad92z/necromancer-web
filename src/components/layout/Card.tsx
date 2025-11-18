import React from 'react';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../styles/tokens';

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
  const [isHovered, setIsHovered] = React.useState(false);

  const paddingValue = typeof padding === 'number' ? padding : SPACING[padding];

  const variantStyles = {
    default: {
      backgroundColor: COLORS.ui.surface,
      border: 'none',
      boxShadow: 'none',
    },
    elevated: {
      backgroundColor: COLORS.ui.surface,
      border: 'none',
      boxShadow: SHADOWS.md,
    },
    outlined: {
      backgroundColor: COLORS.ui.surface,
      border: `1px solid ${COLORS.ui.border}`,
      boxShadow: 'none',
    },
  }[variant];

  const baseStyle: React.CSSProperties = {
    ...variantStyles,
    borderRadius: `${RADIUS.lg}px`,
    padding: `${paddingValue}px`,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 150ms ease',
    ...style,
  };

  const hoverStyle: React.CSSProperties =
    (hoverable || onClick) && isHovered
      ? {
          backgroundColor: COLORS.ui.surfaceHover,
          boxShadow: variant === 'elevated' ? SHADOWS.lg : undefined,
          transform: 'translateY(-2px)',
        }
      : {};

  const finalStyle: React.CSSProperties = {
    ...baseStyle,
    ...hoverStyle,
  };

  return (
    <div
      style={finalStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};
