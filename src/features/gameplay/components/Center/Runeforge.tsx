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
  disabled?: boolean;
  displayOverride?: SelectedDisplayOverride;
  selectionSourceActive?: boolean;
  onCancelSelection?: () => void;
  animatingRuneIds?: Set<string> | null;
}

export function Runeforge({ 
  runeforge, 
  onRuneClick,
  disabled = false,
  displayOverride,
  selectionSourceActive = false,
  onCancelSelection,
  animatingRuneIds = null
}: RuneforgeProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const displayedRunes = displayOverride ? displayOverride.runes : runeforge.runes;
  const selectedRuneIdSet = new Set(displayOverride?.selectedRuneIds ?? []);
  const selectionActive = selectionSourceActive && Boolean(displayOverride);
  const allowCancel = Boolean(onCancelSelection);
  const canHighlightRunes = !selectionActive && !disabled;
  const runeSize = 60;
  const runeGap = 14;
  const containerPadding = 24;
  const baseRuneforgeWidth = displayedRunes.length > 0
    ? (displayedRunes.length * runeSize) + (Math.max(0, displayedRunes.length - 1) * runeGap) + containerPadding
    : 240;
  const runeforgeWidth = Math.min(420, Math.max(280, baseRuneforgeWidth));
  
  const handleRuneClick = (e: React.MouseEvent, rune: Rune) => {
    e.stopPropagation();
    if (onRuneClick) {
      onRuneClick(runeforge.id, rune.runeType, rune.id);
    }
  };
  
  // Determine styling based on state
  const backgroundColor = '#1c1034';
  let borderColor = 'rgba(255, 255, 255, 0.15)';
  const hoverBackgroundColor = '#251646';
  const baseBoxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';
  const ariaLabel = `Open runeforge with ${runeforge.runes.length} runes`;
  const selectableGlowRest = '0 0 20px rgba(168, 85, 247, 0.75), 0 0 48px rgba(129, 140, 248, 0.45)';
  const selectableGlowPeak = '0 0 32px rgba(196, 181, 253, 1), 0 0 70px rgba(129, 140, 248, 0.65)';
  let containerBoxShadow = baseBoxShadow;
  
  // Normal selectable state (green highlight when player can select)
  const isSelectable = !disabled && !selectionActive && runeforge.runes.length > 0 && onRuneClick;
  if (isSelectable) {
    borderColor = '#c084fc';
    containerBoxShadow = isHovered ? selectableGlowPeak : selectableGlowRest;
  }

  const buttonDisabled = selectionActive ? false : (((disabled && !allowCancel) || runeforge.runes.length === 0));
  const effectiveBackgroundColor = isHovered ? hoverBackgroundColor : backgroundColor;
  const effectiveTransform = isHovered ? 'scale(1.02)' : 'scale(1)';

  return (
    <button
      disabled={buttonDisabled}
      onClick={() => {
        if (!buttonDisabled && allowCancel && onCancelSelection && disabled) {
          onCancelSelection();
        }
      }}
      onMouseEnter={() => {
        if (buttonDisabled) {
          return;
        }
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      style={{
        backgroundColor: effectiveBackgroundColor,
        borderRadius: '16px',
        width: `${runeforgeWidth}px`,
        height: '96px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 160ms ease, transform 160ms ease, box-shadow 200ms ease, border-color 160ms ease',
        border: `1px solid ${borderColor}`,
        cursor: selectionActive || !buttonDisabled ? 'pointer' : 'not-allowed',
        outline: 'none',
        boxShadow: containerBoxShadow,
        position: 'relative',
        transform: effectiveTransform
      }}
      aria-label={ariaLabel}
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
              const basePointerEvents = (selectionActive && isSelectedForDisplay) || (!selectionActive && (!disabled || allowCancel)) ? 'auto' : 'none';
              const pointerEvents = isAnimatingRune ? 'none' : basePointerEvents;
              const baseCursor = selectionActive || !disabled ? 'pointer' : 'not-allowed';
              const cursor = isAnimatingRune ? 'default' : baseCursor;
              const transform = isSelectedForDisplay
                ? 'translateY(-2px) scale(1.08)'
                : isHighlighted
                  ? 'scale(1.05)'
                  : 'scale(1)';
              const shadow = isSelectedForDisplay
                ? '0 0 16px rgba(255, 255, 255, 0.45), 0 0 32px rgba(196, 181, 253, 0.35)'
                : isHighlighted
                  ? '0 0 10px rgba(255, 255, 255, 0.4)'
                  : 'none';
              const filter = isSelectedForDisplay
                ? 'brightness(1.15)'
                : isHighlighted
                  ? 'brightness(1.08)'
                  : 'none';
              const selectedAnimation = isSelectedForDisplay
                ? {
                    scale: [1.05, 1.12, 1.05],
                    y: [-2, 2, -2],
                    rotate: [-1.5, 1.5, -1.5]
                  }
                : undefined;
              const selectedTransition = isSelectedForDisplay
                ? { duration: 2, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }
                : undefined;
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
                    boxShadow: shadow,
                    filter,
                    borderRadius: '50%',
                    opacity: isAnimatingRune ? 0 : 1,
                    transform,
                    transition: 'transform 160ms ease, filter 160ms ease, box-shadow 180ms ease, opacity 160ms ease'
                  }}
                  onClick={(e) => handleRuneClick(e, rune)}
                  onMouseEnter={() => {
                    if (!canHighlightRunes) {
                      return;
                    }
                    setHoveredRuneType(rune.runeType);
                  }}
                  onMouseLeave={() => {
                    setHoveredRuneType(null);
                  }}
                  animate={selectedAnimation}
                  transition={selectedTransition}
                >
                  <RuneCell
                    rune={rune}
                    variant="runeforge"
                    size='large'
                    showEffect
                    showTooltip
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </button>
  );
}
