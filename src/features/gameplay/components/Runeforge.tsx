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
  let backgroundColor = '#1c1034';
  let borderColor = 'rgba(255, 255, 255, 0.15)';
  let hoverBackgroundColor = '#251646';
  let boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
  let ariaLabel = `Open runeforge with ${runeforge.runes.length} runes`;
  const selectableGlowRest = '0 0 20px rgba(168, 85, 247, 0.75), 0 0 48px rgba(129, 140, 248, 0.45)';
  const selectableGlowPeak = '0 0 32px rgba(196, 181, 253, 1), 0 0 70px rgba(129, 140, 248, 0.65)';
  const selectableGlowRange: [string, string] = [selectableGlowRest, selectableGlowPeak];
  const frostGlowRest = '0 6px 24px rgba(6, 182, 212, 0.85), inset 0 0 8px rgba(34, 211, 238, 0.25)';
  const frostGlowPeak = '0 10px 34px rgba(59, 130, 246, 1), inset 0 0 14px rgba(34, 211, 238, 0.4)';
  const frostGlowRange: [string, string] = [frostGlowRest, frostGlowPeak];
  let glowRange: [string, string] | null = null;
  let glowDuration = 1.5;
  
  // Normal selectable state (green highlight when player can select)
  const isSelectable = !disabled && !voidEffectPending && !frostEffectPending && runeforge.runes.length > 0 && onRuneClick;
  if (isSelectable) {
    borderColor = '#c084fc';
    boxShadow = selectableGlowRest;
    glowRange = selectableGlowRange;
    glowDuration = 1.5;
  }
  
  // Frost effect styling (cyan)
  if (frostEffectPending && runeforge.runes.length > 0 && !disabled) {
    // Use a dark blue glow instead of changing the background
    borderColor = '#22d3ee';
    hoverBackgroundColor = '#1c1034';
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
        width: 'min(32vmin, 360px)',
        height: 'min(7.5vmin, 84px)',
        padding: 'min(1vmin, 12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        border: `1px solid ${borderColor}`,
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
        <div style={{ color: '#7c8db5', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Empty Forge
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 'min(1.4vmin, 14px)', alignItems: 'center', justifyContent: 'center' }}>
            {runeforge.runes.map((rune) => {
              const isHighlighted = hoveredRuneType === rune.runeType;
              const baseSize = 'min(5.6vmin, 56px)';
              return (
                <div
                  key={rune.id}
                  style={{
                    width: baseSize,
                    height: baseSize,
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
