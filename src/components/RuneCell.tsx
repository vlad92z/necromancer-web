/**
 * RuneCell component - unified cell display for runes across all game areas
 * Supports: Wall cells, Pattern lines, Floor line, Runeforges, Center pool
 * Now uses centralized design tokens for consistent styling
 */

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Rune, RuneEffectRarity, RuneType } from '../types/game';
import { COLORS, RADIUS, TRANSITIONS, SHADOWS, RUNE_SIZE_CONFIG } from '../styles/tokens';
import type { RuneSize } from '../styles/tokens';
import fireRune from '../assets/runes/fire_rune.svg';
import fireRuneUncommon from '../assets/runes/fire_rune_uncommon.svg';
import fireRuneRare from '../assets/runes/fire_rune_rare.svg';
import fireRuneEpic from '../assets/runes/fire_rune_epic.svg';
import frostRune from '../assets/runes/frost_rune.svg';
import frostRuneUncommon from '../assets/runes/frost_rune_uncommon.svg';
import frostRuneRare from '../assets/runes/frost_rune_rare.svg';
import frostRuneEpic from '../assets/runes/frost_rune_epic.svg';
import lifeRune from '../assets/runes/life_rune.svg';
import lifeRuneUncommon from '../assets/runes/life_rune_uncommon.svg';
import lifeRuneRare from '../assets/runes/life_rune_rare.svg';
import lifeRuneEpic from '../assets/runes/life_rune_epic.svg';
import voidRune from '../assets/runes/void_rune.svg';
import voidRuneUncommon from '../assets/runes/void_rune_uncommon.svg';
import voidRuneRare from '../assets/runes/void_rune_rare.svg';
import voidRuneEpic from '../assets/runes/void_rune_epic.svg';
import windRune from '../assets/runes/wind_rune.svg';
import windRuneUncommon from '../assets/runes/wind_rune_uncommon.svg';
import windRuneRare from '../assets/runes/wind_rune_rare.svg';
import windRuneEpic from '../assets/runes/wind_rune_epic.svg';
import lightningRune from '../assets/runes/lightning_rune.svg';
import lightningRuneUncommon from '../assets/runes/lightning_rune_uncommon.svg';
import lightningRuneRare from '../assets/runes/lightning_rune_rare.svg';
import lightningRuneEpic from '../assets/runes/lightning_rune_epic.svg';
import { getRuneEffectDescription, getRuneRarity } from '../utils/runeEffects';

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

const RUNE_RARE_ASSETS = {
  Fire: fireRuneRare,
  Frost: frostRuneRare,
  Life: lifeRuneRare,
  Void: voidRuneRare,
  Wind: windRuneRare,
  Lightning: lightningRuneRare,
};

const RUNE_EPIC_ASSETS = {
  Fire: fireRuneEpic,
  Frost: frostRuneEpic,
  Life: lifeRuneEpic,
  Void: voidRuneEpic,
  Wind: windRuneEpic,
  Lightning: lightningRuneEpic,
};

const RUNE_ASSETS_BY_RARITY: Record<RuneEffectRarity, Record<RuneType, string>> = {
  common: RUNE_ASSETS,
  uncommon: RUNE_UNCOMMON_ASSETS,
  rare: RUNE_RARE_ASSETS,
  epic: RUNE_EPIC_ASSETS,
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
  size?: RuneSize;
  placeholder?: {
    type: 'rune' | 'text';
    runeType?: RuneType; // For wall cells
    text?: string; // For pattern/floor cells
  };
  clickable?: boolean;
  onClick?: () => void;
  showEffect?: boolean;
  showTooltip?: boolean;
  tooltipPlacement?: 'top' | 'bottom';
  runeOpacity?: number;
  runePulseKey?: number;
  runePulseScale?: number;
}

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
  showTooltip = false,
  tooltipPlacement = 'top',
  runeOpacity = 1,
  runePulseKey,
  runePulseScale = 1.12,
}: RuneCellProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const config = RUNE_SIZE_CONFIG[size];
  const usedVariant = forceVariant ?? variant;
  const variantStyle = VARIANT_STYLES[usedVariant];
  
  const runeType = rune?.runeType || placeholder?.runeType;
  const runeRarity = showEffect && rune ? getRuneRarity(rune.effects) : null;
  const runeImage = runeType
    ? runeRarity
      ? RUNE_ASSETS_BY_RARITY[runeRarity][runeType]
      : RUNE_ASSETS[runeType]
    : null;
  
  const isWallPlaceholder = variant === 'wall' && !rune && placeholder?.type === 'rune';
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  const tooltipText = useMemo(() => {
    if (!showTooltip || !rune) {
      return null;
    }
    return getRuneEffectDescription(rune.effects);
  }, [rune, showTooltip]);
  
  // Use occupied background for wall cells that have runes
  // Use `usedVariant` for styling decisions so callers can force visuals
  // without changing semantic behavior.
  const backgroundColor = (usedVariant === 'wall' && (rune) && variantStyle.backgroundOccupied)
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
        width: `${config.dimension}px`,
        height: `${config.dimension}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: shouldAnimate ? undefined : TRANSITIONS.medium,
        borderRadius: `${RADIUS.md}px`,
        border: borderStyle,
        backgroundColor: backgroundColor,
        padding: `${config.padding}px`,
        boxSizing: 'border-box',
        cursor: clickable ? 'pointer' : 'default',
        
        position: 'relative',
        
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {runeImage && (
        <motion.img
          key={runePulseKey ?? 'rune-static'}
          initial={{ scale: 1 }}
          animate={runePulseKey ? { scale: [1, runePulseScale, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          src={runeImage}
          alt={`${runeType}`}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            opacity: ((isWallPlaceholder) ? variantStyle.emptyOpacity ?? 1 : 1) * runeOpacity,
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
            padding: '8px 12px',
            background: 'rgba(8, 7, 16, 0.95)',
            borderRadius: '10px',
            border: `1px solid ${COLORS.ui.borderLight}`,
            color: COLORS.ui.text,
            fontSize: '12px',
            minWidth: '100px',
            textAlign: 'center',
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
