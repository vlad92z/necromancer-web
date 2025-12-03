/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Rune, RuneType } from '../../../../types/game';
import { RuneCell } from '../../../../components/RuneCell';

interface CenterPoolProps {
  centerPool: Rune[];
  onRuneClick?: (runeType: RuneType, runeId: string) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  canDraftFromCenter: boolean;
  selectedRunes: Rune[];
  selectionFromCenter: boolean;
  onCancelSelection?: () => void;
  displayRunesOverride?: Rune[];
  animatingRuneIds?: Set<string> | null;
  hiddenRuneIds?: Set<string>;
}

export function CenterPool({ 
  centerPool, 
  onRuneClick,
  isDraftPhase, 
  hasSelectedRunes,
  canDraftFromCenter,
  selectedRunes,
  selectionFromCenter,
  onCancelSelection,
  displayRunesOverride,
  animatingRuneIds = null,
  hiddenRuneIds
}: CenterPoolProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const [hoveredVoidRuneId, setHoveredVoidRuneId] = useState<string | null>(null);
  const selectedRuneIdSet = selectionFromCenter ? new Set(selectedRunes.map((rune) => rune.id)) : null;
  const baseDisplayRunes =
    selectionFromCenter && displayRunesOverride && displayRunesOverride.length > 0
      ? displayRunesOverride
      : centerPool;
  const baseDisplayRuneIds = new Set(baseDisplayRunes.map((rune) => rune.id));
  const fallbackSelectedRunes =
    selectionFromCenter && (!displayRunesOverride || displayRunesOverride.length === 0)
      ? selectedRunes
          .filter((rune) => !baseDisplayRuneIds.has(rune.id))
          .map((rune) => ({ rune, isSelected: true }))
      : [];
  const displayRunes = [
    ...baseDisplayRunes.map((rune) => ({
      rune,
      isSelected: Boolean(selectedRuneIdSet?.has(rune.id)),
    })),
    ...fallbackSelectedRunes,
  ];
  const totalRunes = displayRunes.length;
  const centerDisabled = !isDraftPhase || hasSelectedRunes || !canDraftFromCenter;
  const canHighlightRunes = (condition: { isSelected: boolean }) => !condition.isSelected && !centerDisabled;
  const selectableGlowRest = '0 0 20px rgba(168, 85, 247, 0.75), 0 0 48px rgba(129, 140, 248, 0.45)';
  const selectableGlowPeak = '0 0 32px rgba(196, 181, 253, 1), 0 0 70px rgba(129, 140, 248, 0.65)';
  const isCenterSelectable = !selectionFromCenter && !centerDisabled && totalRunes > 0 && Boolean(onRuneClick);
  const baseBoxShadow = '0 25px 45px rgba(2, 6, 23, 0.6)';
  const containerBoxShadow = isCenterSelectable ? selectableGlowRest : baseBoxShadow;
  const containerBorder = isCenterSelectable ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)';
  const containerMotionProps = isCenterSelectable
    ? {
        animate: { boxShadow: [selectableGlowRest, selectableGlowPeak] },
        transition: { duration: 1.5, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const }
      }
    : {};
  
  const handleRuneClick = (e: React.MouseEvent, rune: Rune, isSelectedDisplay: boolean) => {
    e.stopPropagation();
    if (isSelectedDisplay && onCancelSelection) {
      onCancelSelection();
      return;
    }
    if (!centerDisabled && onRuneClick) {
      onRuneClick(rune.runeType, rune.id);
    }
  };
  
  // Determine if center pool is selectable (used for visual hints)
  // note: kept for clarity, not used directly in current layout

  // Layout: simple centered horizontal row for all runes in the center pool
  
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: totalRunes === 0 ? 'none' : 'auto' }}>
        <motion.div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          justifyItems: 'center',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '24px',
          background: totalRunes === 0 ? 'transparent' : 'rgba(12, 6, 29, 0.85)',
          border: totalRunes === 0 ? 'none' : containerBorder,
          boxShadow: totalRunes === 0 ? 'none' : containerBoxShadow,
          minWidth: 'min(340px, 90%)',
          maxWidth: '520px',
          width: '100%',
        }} {...containerMotionProps}>
          {displayRunes.map(({ rune, isSelected }) => {
            const highlightByType = hoveredRuneType === rune.runeType && !isSelected;
            const highlightByVoidSelection = hoveredVoidRuneId === rune.id;
            const isHighlighted = highlightByType || highlightByVoidSelection;
            const isAnimatingRune = animatingRuneIds?.has(rune.id) ?? false;
            const isHiddenRune = hiddenRuneIds?.has(rune.id) ?? false;
            const glowStyle = isSelected ? '0 0 14px rgba(255, 255, 255, 0.28)' : 'none';
            const runeSize = 60;
            const isDisabledRune = (centerDisabled && !isSelected);
            const baseOpacity = isDisabledRune ? 0.5 : 1;
            const shouldHideRune = isAnimatingRune || isHiddenRune;
            const opacity = shouldHideRune ? 0 : baseOpacity;
            const motionProps = isSelected
              ? {
                  animate: { scale: [1.08, 1.16, 1.08], y: [-1.5, 1.5, -1.5], rotate: [-1.8, 1.8, -1.8] },
                  transition: { duration: 1, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }
                }
              : {
                  animate: { scale: isHighlighted ? 1.08 : 1, y: 0, rotate: 0 },
                  transition: { duration: 0.2 }
                };

            return (
              <motion.div
                key={`${rune.id}-${isSelected ? 'selected' : 'pool'}`}
                data-rune-id={rune.id}
                data-rune-source="center"
                data-selected-rune={isSelected ? 'true' : undefined}
                style={{
                  width: `${runeSize}px`,
                  height: `${runeSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSelected || !centerDisabled ? 'pointer' : 'not-allowed',
                  opacity,
                  boxShadow: glowStyle,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(9, 4, 30, 0.82)',
                  pointerEvents: shouldHideRune
                    ? 'none'
                    : (isSelected ? 'auto' : (centerDisabled ? 'none' : 'auto'))
                }}
                onClick={(e) => handleRuneClick(e, rune, isSelected)}
                onMouseEnter={() => {
                  if (!canHighlightRunes({ isSelected })) {
                    return;
                  }
                  setHoveredRuneType(rune.runeType);
                  setHoveredVoidRuneId(null);
                }}
                onMouseLeave={() => {
                  setHoveredRuneType(null);
                  setHoveredVoidRuneId(null);
                }}
                {...motionProps}
              >
                <RuneCell
                  rune={rune}
                  variant="center"
                  size="large"
                  showEffect={false}
                />
              </motion.div>
            );
          })}
        </motion.div>
      
    </div>
  );
}
