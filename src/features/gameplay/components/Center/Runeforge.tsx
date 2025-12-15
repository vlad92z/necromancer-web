/**
 * Runeforge - renders a single runeforge row within the selection table
 */

import { motion } from 'framer-motion';
import { useCallback, useMemo, useRef } from 'react';
import { RuneCell } from '../../../../components/RuneCell';
import { RUNE_SIZE_CONFIG } from '../../../../styles/tokens';
import type { ActiveElement, Rune, RuneType, Runeforge as RuneforgeType } from '../../../../types/game';

interface RuneforgeProps {
  runeforge: RuneforgeType;
  runeforgeIndex: number;
  runesPerRuneforge: number;
  hoveredRuneType: RuneType | null;
  hasSelectedRunes: boolean;
  isGlobalSelection: boolean;
  selectedFromRuneforgeId: string | null;
  selectedRuneforgeOriginalRunes: Rune[];
  globalSelectionOriginals: Map<string, Rune[]> | null;
  selectedRuneIdSet: Set<string>;
  animatingRuneIdSet: Set<string> | null;
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onRuneMouseEnter: (
    runeforgeId: string,
    runeforgeIndex: number,
    runeType: RuneType,
    runeId: string,
    slotIndex: number,
    selectionActive: boolean,
    disabled: boolean
  ) => void;
  onRuneMouseLeave: (runeforgeId: string) => void;
  activeElement: ActiveElement | null;
}

export function Runeforge({
  runeforge,
  runeforgeIndex,
  runesPerRuneforge,
  hoveredRuneType,
  hasSelectedRunes,
  isGlobalSelection,
  selectedFromRuneforgeId,
  selectedRuneforgeOriginalRunes,
  globalSelectionOriginals,
  selectedRuneIdSet,
  animatingRuneIdSet,
  onRuneClick,
  onRuneMouseEnter,
  onRuneMouseLeave,
  activeElement,
}: RuneforgeProps) {
  const runeSlotAssignmentsRef = useRef<Record<string, number>>({});

  const computeSlots = useCallback((runes: Rune[], totalSlots: number): (Rune | null)[] => {
    const existingAssignments = runeSlotAssignmentsRef.current;
    const nextAssignments: Record<string, number> = {};
    const usedSlots = new Set<number>();

    runes.forEach((rune) => {
      const existingSlot = existingAssignments[rune.id];
      if (typeof existingSlot === 'number' && existingSlot >= 0 && existingSlot < totalSlots) {
        nextAssignments[rune.id] = existingSlot;
        usedSlots.add(existingSlot);
      }
    });

    let cursor = 0;
    runes.forEach((rune) => {
      if (typeof nextAssignments[rune.id] === 'number') {
        return;
      }
      while (usedSlots.has(cursor)) {
        cursor += 1;
      }
      const assignedSlot = Math.min(cursor, totalSlots - 1);
      nextAssignments[rune.id] = assignedSlot;
      usedSlots.add(assignedSlot);
    });

    runeSlotAssignmentsRef.current = nextAssignments;

    const runeBySlot = new Map<number, Rune>();
    runes.forEach((rune) => {
      const slotIndex = nextAssignments[rune.id];
      if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < totalSlots) {
        runeBySlot.set(slotIndex, rune);
      }
    });

    return Array.from({ length: totalSlots }, (_, index) => runeBySlot.get(index) ?? null);
  }, []);

  const selectionActive = useMemo(
    () => (isGlobalSelection
      ? hasSelectedRunes && Boolean(globalSelectionOriginals?.has(runeforge.id))
      : selectedFromRuneforgeId === runeforge.id && hasSelectedRunes),
    [globalSelectionOriginals, hasSelectedRunes, isGlobalSelection, runeforge.id, selectedFromRuneforgeId]
  );

  const displayedRunes = useMemo(
    () => (selectionActive
      ? (isGlobalSelection
        ? (globalSelectionOriginals?.get(runeforge.id) ?? runeforge.runes)
        : selectedRuneforgeOriginalRunes)
      : runeforge.runes),
    [globalSelectionOriginals, isGlobalSelection, runeforge.id, runeforge.runes, selectionActive, selectedRuneforgeOriginalRunes]
  );

  const slotCount = useMemo(
    () => Math.max(runesPerRuneforge, displayedRunes.length, 1),
    [displayedRunes.length, runesPerRuneforge]
  );

  const slots = useMemo(
    () => computeSlots(displayedRunes, slotCount),
    [computeSlots, displayedRunes, slotCount]
  );

  const runeSize = RUNE_SIZE_CONFIG.large.dimension;
  const runeGap = 14;
  const containerPadding = 24;
  const isRuneforgeDisabled = runeforge.disabled ?? false;
  const baseRuneforgeWidth = (slotCount * runeSize) + (Math.max(0, slotCount - 1) * runeGap) + containerPadding;
  const runeforgeWidth = Math.min(520, Math.max(280, baseRuneforgeWidth));
  const containerOpacity = isRuneforgeDisabled && !selectionActive ? 0.6 : 1;
  const containerCursor = isRuneforgeDisabled && !hasSelectedRunes ? 'not-allowed' : 'default';
  const drafted = slots.some((slotRune) => slotRune === null);
  const containerBoxShadow = drafted ? 'none' : '0 8px 24px rgba(0, 0, 0, 0.45)';
  const shouldGlow = !drafted && !selectionActive;
  const glowBase = `${containerBoxShadow}, 0 0 36px rgba(235, 170, 255, 0.48), 0 0 72px rgba(235, 170, 255, 0.22)`;
  const glowStrong = `${containerBoxShadow}, 0 0 48px rgba(235, 140, 255, 0.60), 0 0 120px rgba(235, 140, 255, 0.28)`;
  const glowAnimation = shouldGlow
    ? {
        boxShadow: [glowBase, glowStrong, glowBase],
        filter: ['brightness(1)', 'brightness(1.06)', 'brightness(1)'],
      }
    : { boxShadow: containerBoxShadow, filter: 'brightness(1)' };
  const glowTransition = shouldGlow
    ? { duration: 4, repeat: Infinity, repeatType: 'mirror' as const, ease: 'easeInOut' as const }
    : { duration: 3, ease: 'easeOut' as const };

  return (
    <motion.div
      style={{
        width: `${runeforgeWidth}px`,
        padding: '12px',
        borderRadius: '16px',
        border: drafted ? 'transparent' : '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: drafted ? 'transparent' : '#1c1034',
        boxShadow: containerBoxShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '96px',
        transition: 'border-color 160ms ease',
        margin: '0 auto',
        opacity: containerOpacity,
        cursor: containerCursor,
      }}
      initial={false}
      animate={glowAnimation}
      transition={glowTransition}
      onMouseLeave={() => onRuneMouseLeave(runeforge.id)}
    >
      {displayedRunes.length !== 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${slotCount}, ${runeSize}px)`,
            gap: `${runeGap}px`,
            alignItems: 'center',
            justifyContent: 'center',
            justifyItems: 'center',
          }}
        >
          {slots.map((slotRune, slotIndex) => {
            if (!slotRune) {
              return (
                <div
                  key={`placeholder-${runeforge.id}-${slotIndex}`}
                  style={{
                    width: `${runeSize}px`,
                    height: `${runeSize}px`,
                  }}
                />
              );
            }

            const rune = slotRune;
            const isSelectedForDisplay = selectedRuneIdSet.has(rune.id);
            const isAnimatingRune = animatingRuneIdSet?.has(rune.id) ?? false;
            const isHighlighted = hoveredRuneType === rune.runeType && !selectionActive;
            const isActiveRune =
              activeElement?.type === 'runeforge-rune' &&
              activeElement.runeforgeIndex === runeforgeIndex &&
              activeElement.runeIndex === slotIndex;
            const pointerEvents = isAnimatingRune
              ? 'none'
              : (selectionActive
                ? (isSelectedForDisplay ? 'auto' : 'none')
                : (!hasSelectedRunes && !isRuneforgeDisabled ? 'auto' : 'none'));
            const cursor = pointerEvents === 'auto' ? 'pointer' : 'not-allowed';
            const transform = isSelectedForDisplay
              ? 'translateY(-2px) scale(1.08)'
              : isActiveRune
                ? 'scale(1.06)'
              : isHighlighted
                ? 'scale(1.05)'
                : 'scale(1)';
            const boxShadow = isSelectedForDisplay
              ? '0 0 20px rgba(255, 255, 255, 0.60), 0 0 48px rgba(235, 170, 255, 0.60), 0 0 96px rgba(235, 170, 255, 0.30)'
              : isActiveRune
                ? '0 0 18px rgba(74, 222, 128, 0.9), 0 0 36px rgba(34, 197, 94, 0.55)'
              : isHighlighted
                ? '0 0 14px rgba(255, 255, 255, 0.5), 0 0 34px rgba(235, 170, 255, 0.32)'
                : 'none';
            const filter = isSelectedForDisplay
              ? 'brightness(1.22)'
              : isActiveRune
                ? 'brightness(1.12)'
              : isHighlighted
                ? 'brightness(1.12)'
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
                  width: `${runeSize}px`,
                  height: `${runeSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents,
                  cursor,
                  boxShadow,
                  filter,
                  borderRadius: '50%',
                  opacity: isAnimatingRune ? 0 : 1,
                  transform,
                  transition: 'transform 160ms ease, filter 160ms ease, box-shadow 180ms ease, opacity 160ms ease'
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (!isAnimatingRune && pointerEvents === 'auto') {
                  onRuneClick(runeforge.id, rune.runeType, rune.id);
                }
              }}
                onPointerEnter={() =>
                  onRuneMouseEnter(runeforge.id, runeforgeIndex, rune.runeType, rune.id, slotIndex, selectionActive, isRuneforgeDisabled)
                }
                onPointerDown={(event) => {
                  if (event.pointerType === 'touch') {
                    onRuneMouseEnter(runeforge.id, runeforgeIndex, rune.runeType, rune.id, slotIndex, selectionActive, isRuneforgeDisabled);
                  }
                }}
                onPointerLeave={() =>
                  onRuneMouseLeave(runeforge.id)
                }
                animate={selectedAnimation}
                transition={selectedTransition}
              >
                <RuneCell
                  rune={rune}
                  variant="runeforge"
                  size="large"
                  showEffect
                  showTooltip={false}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
