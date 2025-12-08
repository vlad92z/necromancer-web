/**
 * DraftingTable component - displays runeforges as rune rows alongside the center pool
 */

import { motion } from 'framer-motion';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { GameState, Runeforge as RuneforgeType, Rune, RuneType } from '../../../../types/game';
import { RUNE_TYPES } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { RuneCell } from '../../../../components/RuneCell';
import { CenterPool } from './CenterPool';
import { RuneTypeTotals } from './RuneTypeTotals';

interface DraftingTableProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onCenterRuneClick: (runeType: RuneType, runeId: string) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
  onCancelSelection: () => void;
  animatingRuneIds?: string[];
  hiddenCenterRuneIds?: Set<string>;
  hideOpponentRow?: boolean;
  runesPerRuneforge: number;
}

export function DraftingTable({ 
  runeforges, 
  centerPool, 
  onRuneClick,
  onCenterRuneClick,
  isDraftPhase, 
  hasSelectedRunes,
  selectedRunes,
  draftSource,
  onCancelSelection,
  animatingRuneIds,
  hiddenCenterRuneIds,
  runesPerRuneforge,
}: DraftingTableProps) {
  const [hoveredRuneTypeByRuneforge, setHoveredRuneTypeByRuneforge] = useState<Record<string, RuneType | null>>({});
  const hasAccessibleRuneforges = runeforges.some((forge) => forge.runes.length > 0);
  const canDraftFromCenter = !hasAccessibleRuneforges;
  const runeSlotAssignmentsRef = useRef<Record<string, Record<string, number>>>({});

  const computeSlots = useCallback((runeforgeId: string, runes: Rune[], totalSlots: number): (Rune | null)[] => {
    const existingAssignments = runeSlotAssignmentsRef.current[runeforgeId] ?? {};
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

    runeSlotAssignmentsRef.current[runeforgeId] = nextAssignments;

    const runeBySlot = new Map<number, Rune>();
    runes.forEach((rune) => {
      const slotIndex = nextAssignments[rune.id];
      if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < totalSlots) {
        runeBySlot.set(slotIndex, rune);
      }
    });

    return Array.from({ length: totalSlots }, (_, index) => runeBySlot.get(index) ?? null);
  }, []);

  const selectedFromRuneforgeId = draftSource?.type === 'runeforge' ? draftSource.runeforgeId : null;
  const selectedRuneforgeOriginalRunes = useMemo(
    () => (draftSource?.type === 'runeforge' ? draftSource.originalRunes : []),
    [draftSource]
  );
  const selectionFromCenter = draftSource?.type === 'center';
  const centerSelectionOriginalRunes = draftSource?.type === 'center' ? draftSource.originalRunes : undefined;
  const selectedRuneIdSet = useMemo(() => new Set(selectedRunes.map((rune) => rune.id)), [selectedRunes]);
  const animatingRuneIdSet = animatingRuneIds ? new Set(animatingRuneIds) : null;
  const runeTypes = useMemo(() => RUNE_TYPES, []);
  const runeCounts = useMemo(
    () => {
      const counts = getRuneTypeCounts({
        runeforges,
        centerPool,
        selectedRunes,
        draftSource
      });
      return counts;
    },
    [centerPool, draftSource, runeforges, selectedRunes]
  );

  const handleRuneMouseEnter = (runeforgeId: string, runeType: RuneType, selectionActive: boolean) => {
    if (selectionActive || hasSelectedRunes) {
      return;
    }
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: runeType }));
  };

  const handleRuneMouseLeave = (runeforgeId: string) => {
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: null }));
  };

  const renderRuneforgeRow = (runeforge: RuneforgeType) => {
    const runeSize = 60;
    const runeGap = 14;
    const containerPadding = 24;
    const selectionActive = selectedFromRuneforgeId === runeforge.id && hasSelectedRunes;
    const displayedRunes = selectionActive ? selectedRuneforgeOriginalRunes : runeforge.runes;
    const hoveredRuneType = hoveredRuneTypeByRuneforge[runeforge.id] ?? null;
    const slotCount = Math.max(runesPerRuneforge, displayedRunes.length, 1);

    const slots = useMemo(
      () => computeSlots(runeforge.id, displayedRunes, slotCount),
      [computeSlots, displayedRunes, runeforge.id, slotCount]
    );

    const baseRuneforgeWidth = (slotCount * runeSize) + (Math.max(0, slotCount - 1) * runeGap) + containerPadding;
    const runeforgeWidth = Math.min(520, Math.max(280, baseRuneforgeWidth));

    return (
      <div
        key={runeforge.id}
        style={{
          width: `${runeforgeWidth}px`,
          padding: '12px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: '#1c1034',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '96px',
          transition: 'border-color 160ms ease, box-shadow 200ms ease',
          margin: '0 auto'
        }}
        onMouseLeave={() => handleRuneMouseLeave(runeforge.id)}
      >
        {displayedRunes.length === 0 ? (
          <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '14px' }}>Empty</div>
        ) : (
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
                      borderRadius: '50%',
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      opacity: 0.6,
                    }}
                  />
                );
              }

              const rune = slotRune;
              const isSelectedForDisplay = selectedRuneIdSet.has(rune.id);
              const isAnimatingRune = animatingRuneIdSet?.has(rune.id) ?? false;
              const isHighlighted = hoveredRuneType === rune.runeType && !selectionActive;
              const pointerEvents = isAnimatingRune
                ? 'none'
                : (selectionActive
                  ? (isSelectedForDisplay ? 'auto' : 'none')
                  : (!hasSelectedRunes ? 'auto' : 'none'));
              const cursor = pointerEvents === 'auto' ? 'pointer' : 'not-allowed';
              const transform = isSelectedForDisplay
                ? 'translateY(-2px) scale(1.08)'
                : isHighlighted
                  ? 'scale(1.05)'
                  : 'scale(1)';
              const boxShadow = isSelectedForDisplay
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAnimatingRune && pointerEvents === 'auto' && onRuneClick) {
                      onRuneClick(runeforge.id, rune.runeType, rune.id);
                    }
                  }}
                  onMouseEnter={() => handleRuneMouseEnter(runeforge.id, rune.runeType, selectionActive)}
                  onMouseLeave={() => handleRuneMouseLeave(runeforge.id)}
                  animate={selectedAnimation}
                  transition={selectedTransition}
                >
                  <RuneCell
                    rune={rune}
                    variant="runeforge"
                    size="large"
                    showEffect
                    showTooltip
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCenterSection = () => (
    <div className="relative w-full flex justify-center mt-1">
      <CenterPool 
        centerPool={centerPool}
        onRuneClick={onCenterRuneClick}
        isDraftPhase={isDraftPhase}
        hasSelectedRunes={hasSelectedRunes}
        canDraftFromCenter={canDraftFromCenter}
        selectedRunes={selectionFromCenter ? selectedRunes : []}
        selectionFromCenter={Boolean(selectionFromCenter)}
        displayRunesOverride={centerSelectionOriginalRunes}
        animatingRuneIds={animatingRuneIdSet}
        hiddenRuneIds={hiddenCenterRuneIds}
      />
    </div>
  );
  
  const handleDraftingTableClick = () => {
    if (hasSelectedRunes) {
      onCancelSelection();
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center gap-4" onClick={handleDraftingTableClick}>
      <RuneTypeTotals runeTypes={runeTypes} counts={runeCounts} />
      <div className="flex flex-col items-center gap-[14px] w-full">
        {runeforges.map((runeforge) => renderRuneforgeRow(runeforge))}
      </div>
      {renderCenterSection()}
      
    </div>
  );
}
