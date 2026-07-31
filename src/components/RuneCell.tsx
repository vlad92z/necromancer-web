/**
 * RuneCell component - unified cell display for runes across current game areas.
 * Now uses centralized design tokens for consistent styling
 */

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import type { Rune, RuneType } from '../types/game';
import { COLORS, TRANSITIONS, RUNE_SIZE_CONFIG } from '../styles/tokens';
import type { RuneSize } from '../styles/tokens';
import { getRuneEffectDescription } from '../utils/runeEffects';
import { getPrimaryRuneType } from '../utils/runeHelpers';

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
    text?: string;
  };
  clickable?: boolean;
  onClick?: () => void;
  showTooltip?: boolean;
  tooltipRune?: Rune | null;
  tooltipPlacement?: 'top' | 'bottom';
  runeOpacity?: number;
  runePulseKey?: number;
  runePulseScale?: number;
}

export function RuneCell({
  rune,
  variant,
  emptyIcon,
  size = 'medium',
  placeholder,
  clickable = false,
  onClick,
  showTooltip = false,
  tooltipRune,
  tooltipPlacement = 'top',
  runeOpacity = 1,
  runePulseKey,
  runePulseScale = 1.3,
}: RuneCellProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const config = RUNE_SIZE_CONFIG[size];
  const runeType = rune ? getPrimaryRuneType(rune) : placeholder?.runeType;
  const runeImage = rune?.tokenImageSrc ?? null;
  
  const hasTextPlaceholder = !rune && placeholder?.type === 'text';
  const tooltipSourceRune = tooltipRune ?? rune;
  const tooltipText = useMemo(() => {
    if (!showTooltip || !tooltipSourceRune) {
      return null;
    }
    return getRuneEffectDescription(tooltipSourceRune);
  }, [showTooltip, tooltipSourceRune]);
  
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
