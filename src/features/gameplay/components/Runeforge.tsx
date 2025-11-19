/**
 * Runeforge component - displays a runeforge with runes
 * Implements Azul-style drafting: click a rune type to select all of that type
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Runeforge as RuneforgeType, RuneType, Rune } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface RuneforgeProps {
  runeforge: RuneforgeType;
  onRuneClick?: (runeforgeId: string, runeType: RuneType) => void;
  onVoidRuneSelect?: (runeforgeId: string, runeId: string) => void;
  disabled?: boolean;
  voidEffectPending?: boolean;
  frostEffectPending?: boolean;
}

export function Runeforge({ 
  runeforge, 
  onRuneClick,
  onVoidRuneSelect,
  disabled = false, 
  voidEffectPending = false, 
  frostEffectPending = false
}: RuneforgeProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const canSelectRunesForVoid = Boolean(
    voidEffectPending && onVoidRuneSelect && !disabled && runeforge.runes.length > 0
  );
  
  const handleRuneClick = (e: React.MouseEvent, rune: Rune) => {
    e.stopPropagation();
    if (canSelectRunesForVoid && onVoidRuneSelect) {
      onVoidRuneSelect(runeforge.id, rune.id);
      return;
    }
    if (!disabled && onRuneClick && !voidEffectPending && !frostEffectPending) {
      onRuneClick(runeforge.id, rune.runeType);
    }
  };
  
  // Determine styling based on state
  let backgroundColor = '#e0f2fe';
  let borderColor = '#bae6fd';
  let hoverBackgroundColor = '#bae6fd';
  let boxShadow = 'none';
  let ariaLabel = `Open runeforge with ${runeforge.runes.length} runes`;
  const selectableGlowRest = '0 0 20px rgba(34, 197, 94, 0.75), 0 0 48px rgba(34, 197, 94, 0.35)';
  const selectableGlowPeak = '0 0 32px rgba(16, 185, 129, 0.95), 0 0 70px rgba(34, 197, 94, 0.55)';
  const selectableGlowRange: [string, string] = [selectableGlowRest, selectableGlowPeak];
  const frostGlowRest = '0 6px 24px rgba(2, 132, 199, 0.9), inset 0 0 8px rgba(6, 182, 212, 0.15)';
  const frostGlowPeak = '0 10px 34px rgba(56, 189, 248, 1), inset 0 0 14px rgba(6, 182, 212, 0.3)';
  const frostGlowRange: [string, string] = [frostGlowRest, frostGlowPeak];
  let glowRange: [string, string] | null = null;
  let glowDuration = 1.5;
  
  // Normal selectable state (green highlight when player can select)
  const isSelectable = !disabled && !voidEffectPending && !frostEffectPending && runeforge.runes.length > 0 && onRuneClick;
  if (isSelectable) {
    borderColor = '#22c55e';
    boxShadow = selectableGlowRest;
    glowRange = selectableGlowRange;
    glowDuration = 1.5;
  }
  
  // Frost effect styling (cyan)
  if (frostEffectPending && runeforge.runes.length > 0 && !disabled) {
    // Use a dark blue glow instead of changing the background
    borderColor = '#0891b2';
    hoverBackgroundColor = '#e0f2fe';
    boxShadow = frostGlowRest;
    glowRange = frostGlowRange;
    glowDuration = 1.4;
    ariaLabel = `Frost effect active - waiting to freeze a pattern line`;
  }
  
  const glowMotionProps = glowRange
    ? {
        animate: { boxShadow: glowRange },
        transition: { duration: glowDuration, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const }
      }
    : {};

  return (
    <motion.button
      disabled={disabled || runeforge.runes.length === 0}
      style={{
        backgroundColor: backgroundColor,
        borderRadius: '16px',
        width: '280px',
        height: '60px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        border: `2px solid ${borderColor}`,
        cursor: (disabled || runeforge.runes.length === 0)
          ? 'not-allowed'
          : (voidEffectPending ? 'default' : 'pointer'),
        outline: 'none',
        boxShadow: boxShadow,
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!voidEffectPending && !frostEffectPending) {
          e.currentTarget.style.backgroundColor = hoverBackgroundColor;
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = backgroundColor;
        e.currentTarget.style.boxShadow = boxShadow;
        e.currentTarget.style.transform = 'scale(1)';
      }}
      aria-label={ariaLabel}
      {...glowMotionProps}
    >
      {runeforge.runes.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '14px' }}>
          
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
            {runeforge.runes.map((rune) => {
              const isHighlighted = hoveredRuneType === rune.runeType;
              const baseSize = 56;
              return (
                <div
                  key={rune.id}
                  style={{
                    width: `${baseSize}px`,
                    height: `${baseSize}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: (!canSelectRunesForVoid && (frostEffectPending || disabled)) ? 'none' : 'auto',
                    cursor: ((frostEffectPending || disabled) ? 'not-allowed' : 'pointer'),
                    transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                    filter: isHighlighted ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none',
                    transform: isHighlighted ? 'scale(1.08)' : 'scale(1)',
                    borderRadius: '50%',
                  }}
                  onClick={(e) => handleRuneClick(e, rune)}
                  onMouseEnter={() => !disabled && !voidEffectPending && !frostEffectPending && setHoveredRuneType(rune.runeType)}
                  onMouseLeave={() => setHoveredRuneType(null)}
                >
                  <RuneCell
                    rune={rune}
                    variant="runeforge"
                    size='large'
                    showEffect={false}
                    isVoidPending={canSelectRunesForVoid}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.button>
  );
}
