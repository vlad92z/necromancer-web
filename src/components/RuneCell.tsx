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
import lightningRune from '../assets/runes/lightning_rune.svg';

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Life: lifeRune,
  Void: voidRune,
  Wind: windRune,
  Lightning: lightningRune,
};

export type RuneCellVariant = 'wall' | 'pattern' | 'floor' | 'runeforge' | 'center' | 'selected';

export interface RuneCellProps {
  rune?: Rune | null;
  variant: RuneCellVariant;
  /**
   * Optionally force the visual variant used for styling. Useful when a floor
   * cell should visually look like a pattern cell without changing its semantic
   * variant (so Wind-in-floor logic still treats it as a floor rune).
   */
  forceVariant?: RuneCellVariant;
  /**
   * Optional icon to display when the cell is empty (no rune and no text placeholder).
   * Useful for showing contextual markers like the overload indicator in floor cells.
   */
  emptyIcon?: string;
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
  isVoidPending?: boolean; // true if a void effect is pending selection
}

const SIZE_CONFIG = {
  small: { width: 30, height: 30, fontSize: 10, padding: 2 },
  medium: { width: 35, height: 35, fontSize: 14, padding: 2 },
  large: { width: 60, height: 60, fontSize: 20, padding: 4 },
};

const VARIANT_STYLES: Record<RuneCellVariant, {
  border: string;
  background: string;
  backgroundOccupied?: string;
  emptyOpacity?: number;
}> = {
  wall: {
    border: `1px solid ${COLORS.ui.borderLight}`,
    background: '#1c0f2e',
    backgroundOccupied: '#46350dff',
    emptyOpacity: 0.35,
  },
  pattern: {
    border: `1px solid ${COLORS.ui.borderLight}`,
    background: '#160a29',
  },
  floor: {
    border: '1px solid rgba(248, 113, 113, 0.6)',
    background: '#2b0b1f',
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
    background: '#2c1254',
  },
};

export function RuneCell({
  rune,
  variant,
  forceVariant,
  emptyIcon,
  size = 'medium',
  placeholder,
  clickable = false,
  onClick,
  showEffect = false,
  isPending = false,
  isVoidPending = false,
}: RuneCellProps) {
  const config = SIZE_CONFIG[size];
  const usedVariant = forceVariant ?? variant;
  const variantStyle = VARIANT_STYLES[usedVariant];
  
  const runeType = rune?.runeType || placeholder?.runeType;
  const runeImage = runeType ? RUNE_ASSETS[runeType] : null;
  
  const isWallPlaceholder = variant === 'wall' && !rune && placeholder?.type === 'rune';
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  const hasEffect = showEffect && Boolean(rune && (rune.effects.passive.length > 0 || rune.effects.active.length > 0));
  
  // Use occupied background for wall cells that have runes OR are pending placement
  // Use `usedVariant` for styling decisions so callers can force visuals
  // without changing semantic behavior.
  const backgroundColor = (usedVariant === 'wall' && (rune || isPending) && variantStyle.backgroundOccupied)
    ? variantStyle.backgroundOccupied
    : variantStyle.background;
  
  // Override border for healing runes on the wall
  const borderStyle = variantStyle.border;
  
  // Only animate wall placements; pattern/floor entries rely on RuneAnimation overlay
  const shouldAnimate = usedVariant === 'wall' && Boolean(rune);
  
  const animationProps = shouldAnimate ? {
    initial: { scale: 0, opacity: 0 } as const,
    animate: { scale: 1, opacity: 1 } as const,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
  } : {};
  
  const Container = shouldAnimate ? motion.div : 'div';
  const glowStyle = '0 0 14px rgba(139, 92, 246, 0.85), 0 0 26px rgba(167, 139, 250, 0.45)';
  return (
    <Container
      {...animationProps}
      onClick={clickable ? onClick : undefined}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: shouldAnimate ? undefined : TRANSITIONS.medium,
        boxShadow: isVoidPending ? glowStyle : 'none',
        borderRadius: isVoidPending ? '50%' : `${RADIUS.md}px`,
        border: borderStyle,
        backgroundColor: backgroundColor,
        padding: isVoidPending ? 0 : `${config.padding}px`,
        cursor: clickable ? 'pointer' : 'default',
        
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
          color: usedVariant === 'floor' ? COLORS.status.error : COLORS.ui.textMuted,
          fontWeight: usedVariant === 'floor' ? 'bold' : 'normal',
        }}>
          {placeholder.text}
        </div>
      )}
      {!rune && !hasTextPlaceholder && emptyIcon && (
        <img
          src={emptyIcon}
          alt=""
          aria-hidden
          style={{
            width: '60%',
            height: '60%',
            objectFit: 'contain',
            opacity: 0.95,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Effect indicator - will be expanded when effects are implemented */}
      {hasEffect && (
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
