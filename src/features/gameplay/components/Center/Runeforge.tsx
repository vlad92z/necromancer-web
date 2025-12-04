/**
 * Runeforge component - displays a runeforge with runes
 * Implements drafting: click a rune type to select all of that type
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Runeforge as RuneforgeType, RuneType, Rune } from '../../../../types/game';
import { RuneCell } from '../../../../components/RuneCell';

interface SelectedDisplayOverride {
  runes: Rune[];
  selectedRuneIds: string[];
}

interface RuneforgeProps {
  runeforge: RuneforgeType;
  onRuneClick?: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onRuneforgeSelect?: (runeforgeId: string) => void;
  disabled?: boolean;
  displayOverride?: SelectedDisplayOverride;
  selectionSourceActive?: boolean;
  onCancelSelection?: () => void;
  animatingRuneIds?: Set<string> | null;
}

export function Runeforge({ 
  runeforge, 
  onRuneClick,
  onRuneforgeSelect,
  disabled = false,
  displayOverride,
  selectionSourceActive = false,
  onCancelSelection,
  animatingRuneIds = null
}: RuneforgeProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const displayedRunes = displayOverride ? displayOverride.runes : runeforge.runes;
  const selectedRuneIdSet = new Set(displayOverride?.selectedRuneIds ?? []);
  const selectionActive = selectionSourceActive && Boolean(displayOverride);
  const canHighlightRunes = !selectionActive && !disabled;
  const runeSize = 60;
  const runeGap = 14;
  const containerPadding = 24;
  const baseRuneforgeWidth = displayedRunes.length > 0
    ? (displayedRunes.length * runeSize) + (Math.max(0, displayedRunes.length - 1) * runeGap) + containerPadding
    : 240;
  const runeforgeWidth = Math.min(420, Math.max(280, baseRuneforgeWidth));
  
  const handleRuneClick = (e: React.MouseEvent, rune: Rune, isSelectedForDisplay: boolean) => {
    e.stopPropagation();
    if (isSelectedForDisplay && onCancelSelection) {
      onCancelSelection();
      return;
    }
    if (onRuneforgeSelect && !disabled) {
      onRuneforgeSelect(runeforge.id);
      return;
    }
    if (selectionActive) {
      return;
    }
    if (!disabled && onRuneClick) {
      onRuneClick(runeforge.id, rune.runeType, rune.id);
    }
  };
  
  // Determine styling based on state
  const backgroundColor = '#1c1034';
  let borderColor = 'rgba(255, 255, 255, 0.15)';
  const hoverBackgroundColor = '#251646';
  let boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
  const ariaLabel = `Open runeforge with ${runeforge.runes.length} runes`;
  const selectableGlowRest = '0 0 20px rgba(168, 85, 247, 0.75), 0 0 48px rgba(129, 140, 248, 0.45)';
  const selectableGlowPeak = '0 0 32px rgba(196, 181, 253, 1), 0 0 70px rgba(129, 140, 248, 0.65)';
  const selectableGlowRange: [string, string] = [selectableGlowRest, selectableGlowPeak];
  let glowRange: [string, string] | null = null;
  let glowDuration = 1.5;
  
  // Normal selectable state (green highlight when player can select)
  const isSelectable = !disabled && !selectionActive && runeforge.runes.length > 0 && (onRuneClick || onRuneforgeSelect);
  if (isSelectable) {
    borderColor = '#c084fc';
    boxShadow = selectableGlowRest;
    glowRange = selectableGlowRange;
    glowDuration = 1.5;
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
      onClick={() => {
        if (!buttonDisabled && onRuneforgeSelect) {
          onRuneforgeSelect(runeforge.id);
        }
      }}
      style={{
        backgroundColor: backgroundColor,
        borderRadius: '16px',
        width: `${runeforgeWidth}px`,
        height: '96px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        border: `1px solid ${borderColor}`,
        cursor: selectionActive || !buttonDisabled ? 'pointer' : 'not-allowed',
        outline: 'none',
        boxShadow: boxShadow,
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBackgroundColor;
        e.currentTarget.style.transform = 'scale(1.02)';
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
        <div>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: `${runeGap}px`, alignItems: 'center', justifyContent: 'center' }}>
            {displayedRunes.map((rune) => {
              const isSelectedForDisplay = selectedRuneIdSet.has(rune.id);
              const isAnimatingRune = animatingRuneIds?.has(rune.id) ?? false;
              const highlightByType = hoveredRuneType === rune.runeType && !displayOverride;
              const isHighlighted = highlightByType;
              const baseSize = `${runeSize}px`;
              const basePointerEvents = (selectionActive && isSelectedForDisplay) || (!selectionActive && !disabled) ? 'auto' : 'none';
              const pointerEvents = isAnimatingRune ? 'none' : basePointerEvents;
              const baseCursor = selectionActive || !disabled ? 'pointer' : 'not-allowed';
              const cursor = isAnimatingRune ? 'default' : baseCursor;
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
                  data-rune-id={rune.id}
                  data-rune-source="runeforge"
                  data-selected-rune={isSelectedForDisplay ? 'true' : undefined}
                  style={{
                    width: baseSize,
                    height: baseSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents,
                    cursor,
                    boxShadow: isSelectedForDisplay
                      ? '0 0 16px rgba(255, 255, 255, 0.45), 0 0 32px rgba(196, 181, 253, 0.35)'
                      : isHighlighted
                        ? '0 0 10px rgba(255, 255, 255, 0.4)'
                        : 'none',
                    filter: isSelectedForDisplay ? 'brightness(1.2)' : (isHighlighted ? 'brightness(1.1)' : 'none'),
                    borderRadius: '50%',
                    opacity: isAnimatingRune ? 0 : 1
                  }}
                  onClick={(e) => handleRuneClick(e, rune, isSelectedForDisplay)}
                  onMouseEnter={() => {
                    if (!canHighlightRunes) {
                      return;
                    }
                    setHoveredRuneType(rune.runeType);
                  }}
                  onMouseLeave={() => {
                    setHoveredRuneType(null);
                  }}
                  {...motionProps}
                >
                  <RuneCell
                    rune={rune}
                    variant="runeforge"
                    size='large'
                    showEffect={false}
                    showTooltip
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
