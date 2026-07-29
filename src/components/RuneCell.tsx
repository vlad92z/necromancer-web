/**
 * RuneCell component - unified cell display for runes across current game areas.
 * Now uses centralized design tokens for consistent styling
 */

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Rune, RuneEffectRarity, RuneType } from '../types/game';
import { COLORS, TRANSITIONS, RUNE_SIZE_CONFIG } from '../styles/tokens';
import type { RuneSize } from '../styles/tokens';
import fireRune from '../assets/runes/fire_rune.png';
import fireRuneUncommon from '../assets/runes/fire_rune_uncommon.png';
import fireRuneRare from '../assets/runes/fire_rune_rare.png';
import fireRuneEpic from '../assets/runes/fire_rune_epic.png';
import frostRune from '../assets/runes/frost_rune.png';
import frostRuneUncommon from '../assets/runes/frost_rune_uncommon.png';
import frostRuneRare from '../assets/runes/frost_rune_rare.png';
import frostRuneEpic from '../assets/runes/frost_rune_epic.png';
import lifeRune from '../assets/runes/life_rune.png';
import lifeRuneUncommon from '../assets/runes/life_rune_uncommon.png';
import lifeRuneRare from '../assets/runes/life_rune_rare.png';
import lifeRuneEpic from '../assets/runes/life_rune_epic.png';
import voidRune from '../assets/runes/void_rune.png';
import voidRuneUncommon from '../assets/runes/void_rune_uncommon.png';
import voidRuneRare from '../assets/runes/void_rune_rare.png';
import voidRuneEpic from '../assets/runes/void_rune_epic.png';
import windRune from '../assets/runes/wind_rune.png';
import windRuneUncommon from '../assets/runes/wind_rune_uncommon.png';
import windRuneRare from '../assets/runes/wind_rune_rare.png';
import windRuneEpic from '../assets/runes/wind_rune_epic.png';
import lightningRune from '../assets/runes/lightning_rune.png';
import lightningRuneUncommon from '../assets/runes/lightning_rune_uncommon.png';
import lightningRuneRare from '../assets/runes/lightning_rune_rare.png';
import lightningRuneEpic from '../assets/runes/lightning_rune_epic.png';
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

export type RuneCellVariant = 'wall' | 'draft';

export interface RuneCellProps {
  rune?: Rune | null;
  variant: RuneCellVariant;
  /** Optional icon to display when the cell is empty. */
  emptyIcon?: string;
  size?: RuneSize;
  placeholder?: {
    type: 'rune' | 'text';
    runeType?: RuneType; // For wall cells
    runeRarity?: RuneEffectRarity;
    text?: string;
  };
  clickable?: boolean;
  onClick?: () => void;
  showEffect?: boolean;
  showTooltip?: boolean;
  tooltipRune?: Rune | null;
  tooltipIncludeChargeRequirement?: boolean;
  tooltipPlacement?: 'top' | 'bottom';
  runeOpacity?: number;
  runePulseKey?: number;
  runePulseScale?: number;
}

const VARIANT_STYLES: Record<RuneCellVariant, {
  border: string;
  background: string;
  backgroundOccupied?: string;
}> = {
  wall: {
    border: '3px solid #141313',
    background: '#293532',
    backgroundOccupied: '#354542',
  },
  draft: {
    border: 'none',
    background: 'transparent',
  },
};

export function RuneCell({
  rune,
  variant,
  emptyIcon,
  size = 'medium',
  placeholder,
  clickable = false,
  onClick,
  showEffect = true,
  showTooltip = false,
  tooltipRune,
  tooltipIncludeChargeRequirement = true,
  tooltipPlacement = 'top',
  runeOpacity = 1,
  runePulseKey,
  runePulseScale = 1.3,
}: RuneCellProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const config = RUNE_SIZE_CONFIG[size];
  const variantStyle = VARIANT_STYLES[variant];
  
  const runeType = rune?.runeType || placeholder?.runeType;
  const runeRarity = showEffect && rune
    ? rune.rarity
    : placeholder?.runeRarity ?? null;
  const runeImage = runeType
    ? runeRarity
      ? RUNE_ASSETS_BY_RARITY[runeRarity][runeType]
      : RUNE_ASSETS[runeType]
    : null;
  
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  const tooltipSourceRune = tooltipRune ?? rune;
  const tooltipText = useMemo(() => {
    if (!showTooltip || !tooltipSourceRune) {
      return null;
    }
    return getRuneEffectDescription(tooltipSourceRune, { includeChargeRequirement: tooltipIncludeChargeRequirement });
  }, [showTooltip, tooltipIncludeChargeRequirement, tooltipSourceRune]);
  
  const backgroundColor = (variant === 'wall' && rune && variantStyle.backgroundOccupied)
    ? variantStyle.backgroundOccupied
    : variantStyle.background;
  
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (clickable) {
      e.currentTarget.style.transform = 'scale(1.05)';
    }
    if (showTooltip && tooltipSourceRune) {
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
    <div
      onClick={clickable ? onClick : undefined}
      style={{
        width: `${config.dimension}px`,
        height: `${config.dimension}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: TRANSITIONS.medium,
        borderRadius: 0,
        backgroundColor: backgroundColor,
        padding: 0,
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
            opacity: runeOpacity,
          }}
        />
      )}
      
      {hasTextPlaceholder && (
        <div style={{ 
          fontSize: `${config.fontSize}px`, 
          color: COLORS.ui.textMuted,
          fontWeight: 'normal',
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
            width: variant === 'wall' ? '100%' : '60%',
            height: variant === 'wall' ? '100%' : '60%',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      )}

      {isTooltipVisible && tooltipText && (
        <div
          style={{
            position: 'absolute',
            padding: '8px 12px',
            background: '#293532',
            borderRadius: 0,
            border: '3px solid #141313',
            color: '#fff8d8',
            fontFamily: "'Silkscreen', monospace",
            fontSize: '12px',
            minWidth: '100px',
            textAlign: 'center',
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
            boxShadow: '4px 4px 0 #141313',
            zIndex: 10,
            pointerEvents: 'none',
            ...tooltipPositionStyles,
          }}
        >
          {tooltipText}
        </div>
      )}
    </div>
  );
}
