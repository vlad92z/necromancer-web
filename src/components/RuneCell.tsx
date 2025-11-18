/**
 * RuneCell component - unified cell display for runes across all game areas
 * Supports: Wall cells, Pattern lines, Floor line, Runeforges, Center pool
 * Now uses centralized design tokens for consistent styling
 */

import { motion } from 'framer-motion';
import type { MouseEvent } from 'react';
import type { Rune, RuneType } from '../types/game';
import { COLORS, RADIUS, TRANSITIONS, SHADOWS } from '../styles/tokens';
import fireRune from '../assets/runes/fire_rune.svg';
import frostRune from '../assets/runes/frost_rune.svg';
import lifeRune from '../assets/runes/life_rune.svg';
import voidRune from '../assets/runes/void_rune.svg';
import windRune from '../assets/runes/wind_rune.svg';

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Life: lifeRune,
  Void: voidRune,
  Wind: windRune,
};

export type RuneCellVariant = 'wall' | 'pattern' | 'floor' | 'runeforge' | 'center' | 'selected';

export interface RuneCellProps {
  rune?: Rune | null;
  variant: RuneCellVariant;
  size?: 'small' | 'medium' | 'large';
  placeholder?: {
    type: 'rune' | 'text';
    runeType?: RuneType; // For wall cells
    text?: string; // For pattern/floor cells
  };
  clickable?: boolean;
  onClick?: () => void;
  showEffect?: boolean;
  isPending?: boolean; // For wall cells with full pattern lines
}

const SIZE_CONFIG = {
  small: { width: 30, height: 30, fontSize: 10, padding: 2 },
  medium: { width: 35, height: 35, fontSize: 14, padding: 2 },
  large: { width: 45, height: 45, fontSize: 20, padding: 4 },
};

const VARIANT_STYLES: Record<RuneCellVariant, {
  border: string;
  background: string;
  backgroundOccupied?: string;
  emptyOpacity?: number;
}> = {
  wall: {
    border: `2px solid ${COLORS.ui.borderLight}`,
    background: '#dbeafe', // Light blue background
    backgroundOccupied: '#fed7aa',
    emptyOpacity: 0.3,
  },
  pattern: {
    border: `2px solid ${COLORS.ui.borderLight}`,
    background: '#dbeafe', // Light blue background
  },
  floor: {
    border: '2px solid #fca5a5',
    background: '#fef2f2',
  },
  runeforge: {
    border: 'none',
    background: 'transparent',
  },
  center: {
    border: 'none',
    background: 'transparent',
  },
  selected: {
    border: `2px solid ${COLORS.ui.accent}`,
    background: '#dbeafe',
  },
};

export function RuneCell({
  rune,
  variant,
  size = 'medium',
  placeholder,
  clickable = false,
  onClick,
  showEffect = false,
  isPending = false,
}: RuneCellProps) {
  const config = SIZE_CONFIG[size];
  const variantStyle = VARIANT_STYLES[variant];
  
  const runeType = rune?.runeType || placeholder?.runeType;
  const runeImage = runeType ? RUNE_ASSETS[runeType] : null;
  
  const isWallPlaceholder = variant === 'wall' && !rune && placeholder?.type === 'rune';
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  
  // Highlight Wind runes in pattern lines to communicate mitigation effect
  const isWindMitigating = variant === 'pattern' && rune?.runeType === 'Wind';
  
  // Use occupied background for wall cells that have runes OR are pending placement
  let backgroundColor = (variant === 'wall' && (rune || isPending) && variantStyle.backgroundOccupied) 
    ? variantStyle.backgroundOccupied 
    : variantStyle.background;
  
  // Override background for mitigating Wind runes in pattern lines
  if (isWindMitigating) {
    backgroundColor = '#e0f2fe'; // Light blue background for Wind mitigation
  }
  
  // Override border for mitigating Wind runes in pattern lines
  let borderStyle = variantStyle.border;
  if (isWindMitigating) {
    borderStyle = '2px solid #38bdf8'; // Blue border for Wind mitigation
  }
  
  // Animate when rune appears in pattern lines, scoring wall, or floor line
  const shouldAnimate = (variant === 'pattern' || variant === 'wall' || variant === 'floor') && rune;
  
  const animationProps = shouldAnimate ? {
    initial: { scale: 0, opacity: 0 } as const,
    animate: { scale: 1, opacity: 1 } as const,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  } : {};
  
  const Container = shouldAnimate ? motion.div : 'div';
  
  return (
    <Container
      {...animationProps}
      onClick={clickable ? onClick : undefined}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        border: borderStyle,
        borderRadius: `${RADIUS.md}px`,
        backgroundColor: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${config.padding}px`,
        cursor: clickable ? 'pointer' : 'default',
        transition: shouldAnimate ? undefined : TRANSITIONS.medium,
        position: 'relative',
      }}
      onMouseEnter={(e: MouseEvent<HTMLDivElement>) => clickable && (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e: MouseEvent<HTMLDivElement>) => clickable && (e.currentTarget.style.transform = 'scale(1)')}
    >
      {runeImage && (
        <img 
          src={runeImage} 
          alt={`${runeType} rune`}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            opacity: isWallPlaceholder ? variantStyle.emptyOpacity : 1,
          }}
        />
      )}
      
      {hasTextPlaceholder && (
        <div style={{ 
          fontSize: `${config.fontSize}px`, 
          color: variant === 'floor' ? COLORS.status.error : COLORS.ui.textMuted,
          fontWeight: variant === 'floor' ? 'bold' : 'normal',
        }}>
          {placeholder.text}
        </div>
      )}
      
      {/* Effect indicator - will be expanded when effects are implemented */}
      {showEffect && rune?.effect.type !== 'None' && (
        <div style={{
          position: 'absolute',
          top: '-4px',
          right: '-4px',
          width: '12px',
          height: '12px',
          borderRadius: RADIUS.round,
          backgroundColor: COLORS.status.warning,
          border: `2px solid ${COLORS.ui.text}`,
          boxShadow: SHADOWS.sm,
        }} />
      )}
    </Container>
  );
}
