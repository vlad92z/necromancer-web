/**
 * DraftingTable component - displays runeforges as rune rows alongside the center pool
 */

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, Runeforge as RuneforgeType, Rune, RuneType } from '../../../../types/game';
import { RUNE_TYPES } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { RuneCell } from '../../../../components/RuneCell';
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
  runeforgeDraftStage: GameState['runeforgeDraftStage'];
}

export function DraftingTable({ 
  runeforges, 
  centerPool, 
  onRuneClick,
  hasSelectedRunes,
  selectedRunes,
  draftSource,
  onCancelSelection,
  animatingRuneIds,
  runesPerRuneforge,
  runeforgeDraftStage,
}: DraftingTableProps) {
  const [hoveredRuneTypeByRuneforge, setHoveredRuneTypeByRuneforge] = useState<Record<string, RuneType | null>>({});
  const runeSlotAssignmentsRef = useRef<Record<string, Record<string, number>>>({});
  const isGlobalDraftStage = runeforgeDraftStage === 'global';

  const computeGlobalHoverState = useCallback(
    (runeType: RuneType): Record<string, RuneType | null> => {
      if (!isGlobalDraftStage) {
        return {};
      }
      const hoverMap: Record<string, RuneType | null> = {};
      runeforges.forEach((runeforge) => {
        const hasRuneType = runeforge.runes.some((rune) => rune.runeType === runeType);
        hoverMap[runeforge.id] = hasRuneType ? runeType : null;
      });
      return hoverMap;
    },
    [isGlobalDraftStage, runeforges]
  );

  useEffect(() => {
    setHoveredRuneTypeByRuneforge({});
  }, [runeforgeDraftStage]);

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
  const globalSelectionOriginals = useMemo(() => {
    if (draftSource?.type !== 'runeforge' || draftSource.selectionMode !== 'global') {
      return null;
    }
    const map = new Map<string, Rune[]>();
    (draftSource.affectedRuneforges ?? []).forEach(({ runeforgeId, originalRunes }) => {
      map.set(runeforgeId, originalRunes);
    });
    return map;
  }, [draftSource]);
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

  const handleRuneMouseEnter = (runeforgeId: string, runeType: RuneType, selectionActive: boolean, disabled: boolean) => {
    if (selectionActive || hasSelectedRunes || disabled) {
      return;
    }
    if (isGlobalDraftStage) {
      const hoverState = computeGlobalHoverState(runeType);
      setHoveredRuneTypeByRuneforge(hoverState);
      return;
    }
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: runeType }));
  };

  const handleRuneMouseLeave = (runeforgeId: string) => {
    if (isGlobalDraftStage) {
      setHoveredRuneTypeByRuneforge({});
      return;
    }
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: null }));
  };

  const renderRuneforgeRow = (runeforge: RuneforgeType) => {
    const runeSize = 70;
    const runeGap = 14;
    const containerPadding = 24;
    const isGlobalSelection = draftSource?.type === 'runeforge' && draftSource.selectionMode === 'global';
    const isRuneforgeDisabled = runeforge.disabled ?? false;
    const selectionActive = isGlobalSelection
      ? hasSelectedRunes && Boolean(globalSelectionOriginals?.has(runeforge.id))
      : selectedFromRuneforgeId === runeforge.id && hasSelectedRunes;
    const displayedRunes = selectionActive
      ? isGlobalSelection
        ? (globalSelectionOriginals?.get(runeforge.id) ?? runeforge.runes)
        : selectedRuneforgeOriginalRunes
      : runeforge.runes;
    const hoveredRuneType = hoveredRuneTypeByRuneforge[runeforge.id] ?? null;
    const slotCount = Math.max(runesPerRuneforge, displayedRunes.length, 1);

    const slots = useMemo(
      () => computeSlots(runeforge.id, displayedRunes, slotCount),
      [computeSlots, displayedRunes, runeforge.id, slotCount]
    );

    const baseRuneforgeWidth = (slotCount * runeSize) + (Math.max(0, slotCount - 1) * runeGap) + containerPadding;
    const runeforgeWidth = Math.min(520, Math.max(280, baseRuneforgeWidth));
    const containerOpacity = isRuneforgeDisabled && !selectionActive ? 0.6 : 1;
    const containerCursor = isRuneforgeDisabled && !hasSelectedRunes ? 'not-allowed' : 'default';
    const drafted = slots.some((s) => s === null);
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
        key={runeforge.id}
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
        onMouseLeave={() => handleRuneMouseLeave(runeforge.id)}
      >
        {displayedRunes.length === 0 ? (
          <div></div>
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
                  : (!hasSelectedRunes && !isRuneforgeDisabled ? 'auto' : 'none'));
              const cursor = pointerEvents === 'auto' ? 'pointer' : 'not-allowed';
              const transform = isSelectedForDisplay
                ? 'translateY(-2px) scale(1.08)'
                : isHighlighted
                  ? 'scale(1.05)'
                  : 'scale(1)';
              const boxShadow = isSelectedForDisplay
                ? '0 0 20px rgba(255, 255, 255, 0.60), 0 0 48px rgba(235, 170, 255, 0.60), 0 0 96px rgba(235, 170, 255, 0.30)'
                : isHighlighted
                  ? '0 0 14px rgba(255, 255, 255, 0.5), 0 0 34px rgba(235, 170, 255, 0.32)'
                  : 'none';
              const filter = isSelectedForDisplay
                ? 'brightness(1.22)'
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAnimatingRune && pointerEvents === 'auto' && onRuneClick) {
                      onRuneClick(runeforge.id, rune.runeType, rune.id);
                    }
                  }}
                  onMouseEnter={() => handleRuneMouseEnter(runeforge.id, rune.runeType, selectionActive, isRuneforgeDisabled)}
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
      </motion.div>
    );
  };
  
  const handleDraftingTableClick = () => {
    if (hasSelectedRunes) {
      onCancelSelection();
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center gap-4" onClick={handleDraftingTableClick}>
      
      <div className="flex flex-col items-center gap-[14px] w-full">
        {runeforges.map((runeforge) => renderRuneforgeRow(runeforge))}
      </div>
      <RuneTypeTotals runeTypes={runeTypes} counts={runeCounts} />
    </div>
  );
}
