/**
 * RuneCell component - unified cell display for runes across all game areas
 * Supports: Wall cells, Pattern lines, Floor line, Runeforges, Center pool
 * Now uses centralized design tokens for consistent styling
 */

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Rune, RuneType } from '../types/game';
import { COLORS, RADIUS, TRANSITIONS, SHADOWS } from '../styles/tokens';
import fireRune from '../assets/runes/fire_rune.svg';
import fireRuneUncommon from '../assets/runes/fire_rune_uncommon.svg';
import frostRune from '../assets/runes/frost_rune.svg';
import frostRuneUncommon from '../assets/runes/frost_rune_uncommon.svg';
import lifeRune from '../assets/runes/life_rune.svg';
import lifeRuneUncommon from '../assets/runes/life_rune_uncommon.svg';
import voidRune from '../assets/runes/void_rune.svg';
import voidRuneUncommon from '../assets/runes/void_rune_uncommon.svg';
import windRune from '../assets/runes/wind_rune.svg';
import windRuneUncommon from '../assets/runes/wind_rune_uncommon.svg';
import lightningRune from '../assets/runes/lightning_rune.svg';
import lightningRuneUncommon from '../assets/runes/lightning_rune_uncommon.svg';
import { getRuneEffectDescription } from '../utils/runeEffects';

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Life: lifeRune,
  Void: voidRune,
  Wind: windRune,
  Lightning: lightningRune,
};

const RUNE_UNCOMMON_ASSETS = {
  Fire: fireRuneUncommon,
  Frost: frostRuneUncommon,
  Life: lifeRuneUncommon,
  Void: voidRuneUncommon,
  Wind: windRuneUncommon,
  Lightning: lightningRuneUncommon,
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
  showTooltip?: boolean;
  tooltipPlacement?: 'top' | 'bottom';
  runeOpacity?: number;
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
  showEffect = true,
  isPending = false,
  showTooltip = false,
  tooltipPlacement = 'top',
  runeOpacity = 1,
}: RuneCellProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const config = SIZE_CONFIG[size];
  const usedVariant = forceVariant ?? variant;
  const variantStyle = VARIANT_STYLES[usedVariant];
  
  const runeType = rune?.runeType || placeholder?.runeType;
  const hasEffect = showEffect && Boolean(rune && rune.effects.length > 0);
  const runeImage = runeType
    ? (hasEffect ? RUNE_UNCOMMON_ASSETS[runeType] : RUNE_ASSETS[runeType])
    : null;
  
  const isWallPlaceholder = variant === 'wall' && !rune && placeholder?.type === 'rune';
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  const tooltipText = useMemo(() => {
    if (!showTooltip || !rune) {
      return null;
    }
    return getRuneEffectDescription(rune.runeType, rune.effects);
  }, [rune, showTooltip]);
  
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

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (clickable) {
      e.currentTarget.style.transform = 'scale(1.05)';
    }
    if (showTooltip && rune) {
      setIsTooltipVisible(true);
    }
  };

  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (clickable) {
      e.currentTarget.style.transform = 'scale(1)';
    }
    if (isTooltipVisible) {
      setIsTooltipVisible(false);
    }
  };

  const tooltipPositionStyles = tooltipPlacement === 'bottom'
    ? { top: 'calc(100% + 8px)', bottom: 'auto' }
    : { bottom: 'calc(100% + 8px)', top: 'auto' };

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
        borderRadius: `${RADIUS.md}px`,
        border: borderStyle,
        backgroundColor: backgroundColor,
        padding: `${config.padding}px`,
        cursor: clickable ? 'pointer' : 'default',
        
        position: 'relative',
        
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {runeImage && (
        <img 
          src={runeImage} 
          alt={`${runeType} rune`}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            opacity: ((isWallPlaceholder && !isPending) ? variantStyle.emptyOpacity ?? 1 : 1) * runeOpacity,
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

      {isTooltipVisible && tooltipText && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            background: 'rgba(8, 7, 16, 0.95)',
            borderRadius: '10px',
            border: `1px solid ${COLORS.ui.borderLight}`,
            color: COLORS.ui.text,
            fontSize: '12px',
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
            boxShadow: SHADOWS.md,
            zIndex: 10,
            pointerEvents: 'none',
            ...tooltipPositionStyles,
          }}
        >
          {tooltipText}
        </div>
      )}
    </Container>
  );
}
