/**
 * Runeforge component - displays a runeforge with runes
 * Implements Azul-style drafting: click a rune type to select all of that type
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Runeforge as RuneforgeType, RuneType, Rune } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface SelectedDisplayOverride {
  runes: Rune[];
  selectedRuneIds: string[];
}

interface RuneforgeProps {
  runeforge: RuneforgeType;
  onRuneClick?: (runeforgeId: string, runeType: RuneType) => void;
  onVoidRuneSelect?: (runeforgeId: string, runeId: string) => void;
  disabled?: boolean;
  voidEffectPending?: boolean;
  frostEffectPending?: boolean;
  displayOverride?: SelectedDisplayOverride;
  selectionSourceActive?: boolean;
  onCancelSelection?: () => void;
}

export function Runeforge({ 
  runeforge, 
  onRuneClick,
  onVoidRuneSelect,
  disabled = false, 
  voidEffectPending = false, 
  frostEffectPending = false,
  displayOverride,
  selectionSourceActive = false,
  onCancelSelection
}: RuneforgeProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const canSelectRunesForVoid = Boolean(
    voidEffectPending && onVoidRuneSelect && !disabled && runeforge.runes.length > 0
  );
  const displayedRunes = displayOverride ? displayOverride.runes : runeforge.runes;
  const selectedRuneIdSet = new Set(displayOverride?.selectedRuneIds ?? []);
  const selectionActive = selectionSourceActive && Boolean(displayOverride);
  
  const handleRuneClick = (e: React.MouseEvent, rune: Rune, isSelectedForDisplay: boolean) => {
    e.stopPropagation();
    if (isSelectedForDisplay && onCancelSelection) {
      onCancelSelection();
      return;
    }
    if (selectionActive) {
      return;
    }
    if (canSelectRunesForVoid && onVoidRuneSelect) {
      onVoidRuneSelect(runeforge.id, rune.id);
      return;
    }
    if (!disabled && onRuneClick && !voidEffectPending && !frostEffectPending) {
      onRuneClick(runeforge.id, rune.runeType);
    }
  };
  
  // Determine styling based on state
  const backgroundColor = '#1c1034';
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
  const isSelectable = !disabled && !selectionActive && !voidEffectPending && !frostEffectPending && runeforge.runes.length > 0 && onRuneClick;
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

  const buttonDisabled = selectionActive ? false : (disabled || runeforge.runes.length === 0);

  return (
    <motion.button
      disabled={buttonDisabled}
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
        cursor: selectionActive
          ? 'pointer'
          : (buttonDisabled ? 'not-allowed' : (voidEffectPending ? 'default' : 'pointer')),
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
      {displayedRunes.length === 0 ? (
        <div style={{ color: '#7c8db5', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Empty Forge
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 'min(1.4vmin, 14px)', alignItems: 'center', justifyContent: 'center' }}>
            {displayedRunes.map((rune) => {
              const isSelectedForDisplay = selectedRuneIdSet.has(rune.id);
              const isHighlighted = hoveredRuneType === rune.runeType && !displayOverride;
              const baseSize = 'min(5.6vmin, 56px)';
              const motionProps = isSelectedForDisplay
                ? {
                    animate: { scale: [1.05, 1.12, 1.05], y: [-2, 2, -2], rotate: [-1.5, 1.5, -1.5] },
                    transition: { duration: 1, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }
                  }
                : {
                    animate: { scale: isHighlighted ? 1.08 : 1, y: 0, rotate: 0 },
                    transition: { duration: 0.2 }
                  };
              return (
                <motion.div
                  key={rune.id}
                  style={{
                    width: baseSize,
                    height: baseSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: selectionActive
                      ? (isSelectedForDisplay ? 'auto' : 'none')
                      : ((!canSelectRunesForVoid && (frostEffectPending || disabled)) ? 'none' : 'auto'),
                    cursor: selectionActive
                      ? (isSelectedForDisplay ? 'pointer' : 'not-allowed')
                      : ((frostEffectPending || disabled) ? 'not-allowed' : 'pointer'),
                    boxShadow: isSelectedForDisplay
                      ? '0 0 16px rgba(255, 255, 255, 0.45), 0 0 32px rgba(196, 181, 253, 0.35)'
                      : isHighlighted
                        ? '0 0 10px rgba(255, 255, 255, 0.4)'
                        : 'none',
                    filter: isSelectedForDisplay ? 'brightness(1.2)' : (isHighlighted ? 'brightness(1.1)' : 'none'),
                    borderRadius: '50%',
                  }}
                  onClick={(e) => handleRuneClick(e, rune, isSelectedForDisplay)}
                  onMouseEnter={() => {
                    if (!disabled && !voidEffectPending && !frostEffectPending && !selectionActive) {
                      setHoveredRuneType(rune.runeType);
                    }
                  }}
                  onMouseLeave={() => setHoveredRuneType(null)}
                  {...motionProps}
                >
                  <RuneCell
                    rune={rune}
                    variant="runeforge"
                    size='large'
                    showEffect={false}
                    isVoidPending={canSelectRunesForVoid}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.button>
  );
}
