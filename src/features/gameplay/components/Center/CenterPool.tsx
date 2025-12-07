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
  displayRunesOverride,
  animatingRuneIds = null,
  hiddenRuneIds
}: CenterPoolProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  const [hoveredVoidRuneId, setHoveredVoidRuneId] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
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
  const containerBoxShadow = isCenterSelectable
    ? (isHovered ? selectableGlowPeak : selectableGlowRest)
    : baseBoxShadow;
  const containerBorder = isCenterSelectable ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)';
  
  const handleRuneClick = (e: React.MouseEvent, rune: Rune) => {
    e.stopPropagation();
    if (onRuneClick) {
      onRuneClick(rune.runeType, rune.id);
    }
  };
  
  // Determine if center pool is selectable (used for visual hints)
  // note: kept for clarity, not used directly in current layout

  // Layout: simple centered horizontal row for all runes in the center pool
  
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: totalRunes === 0 ? 'none' : 'auto' }}>
        <div
          style={{
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
            transition: 'box-shadow 200ms ease, border-color 160ms ease'
          }}
          onMouseEnter={() => {
            if (!isCenterSelectable) {
              return;
            }
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
          }}
        >
          {displayRunes.map(({ rune, isSelected }) => {
            const highlightByType = hoveredRuneType === rune.runeType && !isSelected;
            const highlightByVoidSelection = hoveredVoidRuneId === rune.id;
            const isHighlighted = highlightByType || highlightByVoidSelection;
            const isAnimatingRune = animatingRuneIds?.has(rune.id) ?? false;
            const isHiddenRune = hiddenRuneIds?.has(rune.id) ?? false;
            const runeSize = 60;
            const isDisabledRune = (centerDisabled && !isSelected);
            const baseOpacity = isDisabledRune ? 0.5 : 1;
            const shouldHideRune = isAnimatingRune || isHiddenRune;
            const opacity = shouldHideRune ? 0 : baseOpacity;
            const transform = isSelected
              ? 'translateY(-1.5px) scale(1.07)'
              : isHighlighted
                ? 'scale(1.05)'
                : 'scale(1)';
            const shadow = isSelected ? '0 0 14px rgba(255, 255, 255, 0.28)' : 'none';
            const filter = isSelected ? 'brightness(1.12)' : isHighlighted ? 'brightness(1.06)' : 'none';

            const selectedAnimation = isSelected
              ? {
                  scale: [1.08, 1.16, 1.08],
                  y: [-1.5, 1.5, -1.5],
                  rotate: [-1.8, 1.8, -1.8]
                }
              : undefined;
            const selectedTransition = isSelected
              ? { duration: 2, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }
              : undefined;

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
                  boxShadow: shadow,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(9, 4, 30, 0.82)',
                  pointerEvents: shouldHideRune
                    ? 'none'
                    : (isSelected ? 'auto' : (centerDisabled ? 'none' : 'auto')),
                  transform,
                  filter,
                  transition: 'transform 160ms ease, filter 160ms ease, box-shadow 180ms ease, opacity 160ms ease'
                }}
                animate={selectedAnimation}
                transition={selectedTransition}
                onClick={(e) => handleRuneClick(e, rune)}
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
              >
                <RuneCell
                  rune={rune}
                  variant="center"
                  size="large"
                  showEffect
                  showTooltip
                />
              </motion.div>
            );
          })}
        </div>
      
    </div>
  );
}
