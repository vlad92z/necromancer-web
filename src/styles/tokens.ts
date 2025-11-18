/**
 * Design Tokens
 * Centralized style constants for consistent theming across the application
 */

export const COLORS = {
  runes: {
    Fire: '#FF4500',
    Frost: '#1E90FF',
    Life: '#32CD32',
    Void: '#8B008B',
    Wind: '#F0E68C',
  },
  ui: {
    background: '#1a1a1a',
    backgroundLight: '#2a2a2a',
    surface: '#2a2a2a',
    surfaceHover: '#333333',
    border: '#333',
    borderLight: '#444',
    accent: '#4a9eff',
    accentHover: '#6bb1ff',
    text: '#ffffff',
    textMuted: '#999999',
    textDisabled: '#666666',
  },
  status: {
    success: '#00ff00',
    error: '#ff0000',
    warning: '#ffaa00',
    info: '#00aaff',
  },
  effects: {
    fireGlow: 'rgba(255, 69, 0, 0.3)',
    frostGlow: 'rgba(30, 144, 255, 0.3)',
    lifeGlow: 'rgba(50, 205, 50, 0.3)',
    voidGlow: 'rgba(139, 0, 139, 0.3)',
    windGlow: 'rgba(240, 230, 140, 0.3)',
  },
  overlay: {
    backdrop: 'rgba(0, 0, 0, 0.7)',
    backdropLight: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const TYPOGRAPHY = {
  small: 12,
  base: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
  xxlarge: 24,
  heading: 28,
  headingLarge: 32,
  display: 40,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: '50%',
} as const;

export const SHADOWS = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 4px 8px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.5)',
  xl: '0 12px 24px rgba(0, 0, 0, 0.6)',
  glow: '0 0 10px rgba(74, 158, 255, 0.5)',
  runeGlow: (color: string) => `0 0 10px ${color}`,
} as const;

export const TRANSITIONS = {
  fast: '150ms ease',
  medium: '250ms ease',
  slow: '350ms ease',
  spring: '350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  overlay: 200,
  modal: 300,
  tooltip: 400,
  notification: 500,
} as const;

/**
 * Helper function to get rune-specific glow color
 */
export function getRuneGlow(runeType: 'Fire' | 'Frost' | 'Life' | 'Void' | 'Wind'): string {
  const glowMap = {
    Fire: COLORS.effects.fireGlow,
    Frost: COLORS.effects.frostGlow,
    Life: COLORS.effects.lifeGlow,
    Void: COLORS.effects.voidGlow,
    Wind: COLORS.effects.windGlow,
  };
  return glowMap[runeType];
}

/**
 * Helper function to create responsive values based on viewport width
 */
export function getResponsiveValue<T>(mobile: T, desktop: T, currentWidth: number): T {
  return currentWidth < BREAKPOINTS.tablet ? mobile : desktop;
}
