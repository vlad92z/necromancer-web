import React from 'react';
import { COLORS, RADIUS, SPACING, TRANSITIONS } from '../../styles/tokens';

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
  style = {},
  ...props
}) => {
  const sizeStyles = {
    small: {
      padding: `${SPACING.xs}px ${SPACING.sm}px`,
      fontSize: '12px',
    },
    medium: {
      padding: `${SPACING.sm}px ${SPACING.md}px`,
      fontSize: '14px',
    },
    large: {
      padding: `${SPACING.md}px ${SPACING.lg}px`,
      fontSize: '16px',
    },
  }[size];

  const variantStyles = {
    primary: {
      backgroundColor: COLORS.ui.accent,
      color: COLORS.ui.text,
      border: 'none',
      hover: {
        backgroundColor: COLORS.ui.accentHover,
      },
    },
    secondary: {
      backgroundColor: COLORS.ui.surface,
      color: COLORS.ui.text,
      border: `1px solid ${COLORS.ui.border}`,
      hover: {
        backgroundColor: COLORS.ui.surfaceHover,
        borderColor: COLORS.ui.borderLight,
      },
    },
    danger: {
      backgroundColor: COLORS.status.error,
      color: COLORS.ui.text,
      border: 'none',
      hover: {
        backgroundColor: '#cc0000',
      },
    },
    success: {
      backgroundColor: COLORS.status.success,
      color: COLORS.ui.background,
      border: 'none',
      hover: {
        backgroundColor: '#00cc00',
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: COLORS.ui.text,
      border: 'none',
      hover: {
        backgroundColor: COLORS.ui.surface,
      },
    },
  }[variant];

  const baseStyle: React.CSSProperties = {
    ...sizeStyles,
    ...variantStyles,
    borderRadius: `${RADIUS.md}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    transition: TRANSITIONS.fast,
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${SPACING.xs}px`,
    ...style,
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const finalStyle: React.CSSProperties = {
    ...baseStyle,
    ...(isHovered && !disabled ? variantStyles.hover : {}),
  };

  return (
    <button
      style={finalStyle}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};
