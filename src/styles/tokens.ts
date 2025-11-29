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
    Lightning: '#7dd3fc',
  },
  ui: {
    background: '#0c051c',
    backgroundLight: '#140b2c',
    surface: '#1a1032',
    surfaceHover: '#231542',
    border: 'rgba(255, 255, 255, 0.12)',
    borderLight: 'rgba(255, 255, 255, 0.28)',
    accent: '#a855f7',
    accentHover: '#c084fc',
    text: '#f5f3ff',
    textMuted: '#c1b7e6',
    textDisabled: '#6b5d91',
  },
  status: {
    success: '#4ade80',
    error: '#fb7185',
    warning: '#facc15',
    info: '#38bdf8',
  },
  effects: {
    fireGlow: 'rgba(248, 113, 113, 0.35)',
    frostGlow: 'rgba(59, 130, 246, 0.35)',
    lifeGlow: 'rgba(74, 222, 128, 0.35)',
    voidGlow: 'rgba(217, 70, 239, 0.35)',
    windGlow: 'rgba(250, 204, 21, 0.35)',
    lightningGlow: 'rgba(125, 211, 252, 0.35)',
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

export const ANIMATION = {
  HEAL_ANIMATION_DURATION_MS: 500,
  HEAL_TO_DAMAGE_DELAY_MS: 250,
  DAMAGE_ANIMATION_DURATION_MS: 500,
  PLAYER_SEQUENCE_PADDING_MS: 500,
  BASE_SEQUENCE_DELAY_MS: 1200,
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
export function getRuneGlow(runeType: 'Fire' | 'Frost' | 'Life' | 'Void' | 'Wind' | 'Lightning'): string {
  const glowMap = {
    Fire: COLORS.effects.fireGlow,
    Frost: COLORS.effects.frostGlow,
    Life: COLORS.effects.lifeGlow,
    Void: COLORS.effects.voidGlow,
    Wind: COLORS.effects.windGlow,
    Lightning: COLORS.effects.lightningGlow,
  };
  return glowMap[runeType];
}

/**
 * Helper function to create responsive values based on viewport width
 */
export function getResponsiveValue<T>(mobile: T, desktop: T, currentWidth: number): T {
  return currentWidth < BREAKPOINTS.tablet ? mobile : desktop;
}
