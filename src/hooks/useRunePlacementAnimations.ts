/**
 * useRunePlacementAnimations - manages rune placement overlay animations and temporary hides
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AnimatingRune, GameState, Rune } from '../types/game';
import { RUNE_SIZE_CONFIG } from '../styles/tokens';

interface SelectionSnapshot {
  playerId: string;
  runeOrder: Rune[];
  patternLineCounts: number[];
  runePositions: Map<string, MeasuredRunePosition>;
  floorRuneCount: number;
}

interface AutoAnimationMeta {
  pattern?: { playerId: string; slotKeys: string[] };
  floor?: { playerId: string; slotIndexes: number[] };
}

interface RuneforgeAnimationSnapshot {
  key: string;
  runes: Rune[];
  runePositions: Map<string, MeasuredRunePosition>;
}

interface MeasuredRunePosition {
  centerX: number;
  centerY: number;
  size: number;
}

interface UseRunePlacementAnimationsParams {
  player: GameState['player'];
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
}

const OVERLAY_RUNE_SIZE = RUNE_SIZE_CONFIG.large.dimension;

export function useRunePlacementAnimations({
  player,
  selectedRunes,
  draftSource,
}: UseRunePlacementAnimationsParams) {
  const [animatingRunes, setAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [hiddenPatternSlots, setHiddenPatternSlots] = useState<Record<string, Set<string>>>({});
  const manualAnimationRef = useRef(false);
  const selectionSnapshotRef = useRef<SelectionSnapshot | null>(null);
  const previousSelectedCountRef = useRef<number>(selectedRunes.length);
  const autoAnimationMetaRef = useRef<AutoAnimationMeta | null>(null);
  const lastRuneforgeAnimationKeyRef = useRef<string | null>(null);
  const runeforgeAnimationSnapshotRef = useRef<RuneforgeAnimationSnapshot | null>(null);
  const selectionMeasurementRafRef = useRef<number | undefined>(undefined);
  const runeforgeMeasurementRafRef = useRef<number | undefined>(undefined);

  const isAnimatingPlacement = animatingRunes.length > 0;

  const hidePatternSlots = useCallback((playerId: string, slotKeys: string[]) => {
    if (slotKeys.length === 0) {
      return;
    }
    setHiddenPatternSlots((prev) => {
      const playerSet = prev[playerId] ? new Set(prev[playerId]) : new Set<string>();
      slotKeys.forEach((key) => playerSet.add(key));
      return {
        ...prev,
        [playerId]: playerSet,
      };
    });
  }, []);

  const revealPatternSlots = useCallback((playerId: string, slotKeys: string[]) => {
    if (slotKeys.length === 0) {
      return;
    }
    setHiddenPatternSlots((prev) => {
      const playerSet = prev[playerId];
      if (!playerSet) {
        return prev;
      }
      const nextSet = new Set(playerSet);
      slotKeys.forEach((key) => nextSet.delete(key));
      const nextState = { ...prev };
      if (nextSet.size === 0) {
        delete nextState[playerId];
      } else {
        nextState[playerId] = nextSet;
      }
      return nextState;
    });
  }, []);

  const captureSelectedRunePositions = useCallback((runes: Rune[]): Map<string, MeasuredRunePosition> => {
    const positions = new Map<string, MeasuredRunePosition>();
    if (typeof document === 'undefined' || runes.length === 0) {
      return positions;
    }

    const runeIdSet = new Set(runes.map((rune) => rune.id));
    const elements = document.querySelectorAll<HTMLElement>('[data-selected-rune="true"][data-rune-id]');
    elements.forEach((element) => {
      const runeId = element.dataset.runeId;
      if (!runeId || !runeIdSet.has(runeId)) {
        return;
      }
      const rect = element.getBoundingClientRect();
      positions.set(runeId, {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        size: rect.width,
      });
    });
    return positions;
  }, []);

  const captureRuneforgeRunePositions = useCallback((runes: Rune[]): Map<string, MeasuredRunePosition> => {
    const positions = new Map<string, MeasuredRunePosition>();
    if (typeof document === 'undefined' || runes.length === 0) {
      return positions;
    }

    const runeIdSet = new Set(runes.map((rune) => rune.id));
    const elements = document.querySelectorAll<HTMLElement>('[data-rune-source="runeforge"][data-rune-id]');
    elements.forEach((element) => {
      const runeId = element.dataset.runeId;
      if (!runeId || !runeIdSet.has(runeId)) {
        return;
      }
      const rect = element.getBoundingClientRect();
      positions.set(runeId, {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        size: rect.width,
      });
    });
    return positions;
  }, []);

  const triggerAutoPlacementAnimation = useCallback(() => {
    const snapshot = selectionSnapshotRef.current;
    selectionSnapshotRef.current = null;
    if (!snapshot || typeof document === 'undefined') {
      return;
    }

    const targetPlayer = player;
    const updatedCounts = targetPlayer.patternLines.map((line) => line.count);
    const previousCounts = snapshot.patternLineCounts;
    const changedLineIndex = updatedCounts.findIndex((count, index) => count > (previousCounts[index] ?? 0));
    const patternSlotKeys: string[] = [];
    let patternRunesUsed = 0;

    if (changedLineIndex !== -1) {
      const placedCount = updatedCounts[changedLineIndex] - (previousCounts[changedLineIndex] ?? 0);
      if (placedCount > 0) {
        for (let offset = 0; offset < placedCount; offset += 1) {
          const slotIndex = (previousCounts[changedLineIndex] ?? 0) + offset;
          patternSlotKeys.push(`${changedLineIndex}-${slotIndex}`);
        }
        patternRunesUsed = placedCount;
      }
    }

    let autoMeta: AutoAnimationMeta | null = null;
    if (patternSlotKeys.length > 0) {
      hidePatternSlots(snapshot.playerId, patternSlotKeys);
      autoMeta = { pattern: { playerId: snapshot.playerId, slotKeys: patternSlotKeys } };
    }

    const patternSlotLookup = new Map<string, HTMLElement>();
    if (changedLineIndex !== -1) {
      const candidates = document.querySelectorAll<HTMLElement>(
        `[data-player-id="${snapshot.playerId}"][data-pattern-line-index="${changedLineIndex}"][data-pattern-slot-index]`,//TODO: Just use a static ID
      );
      candidates.forEach((element) => {
        const lineIndex = element.getAttribute('data-pattern-line-index');
        const slotIndex = element.getAttribute('data-pattern-slot-index');
        if (lineIndex !== null && slotIndex !== null) {
          patternSlotLookup.set(`${lineIndex}-${slotIndex}`, element);
        }
      });
    }

    const strainCounterElement = document.querySelector<HTMLElement>(
      `[data-player-id="${snapshot.playerId}"][data-strain-counter="true"]`,
    );

    requestAnimationFrame(() => {
      const overlayRunes: AnimatingRune[] = [];

      if (changedLineIndex !== -1 && patternRunesUsed > 0) {
        const runesToAnimate = snapshot.runeOrder.slice(0, patternRunesUsed);
        runesToAnimate.forEach((rune, offset) => {
          const start = snapshot.runePositions.get(rune.id);
          if (!start) {
            return;
          }
          const slotIndex = (previousCounts[changedLineIndex] ?? 0) + offset;
          const targetElement = patternSlotLookup.get(`${changedLineIndex}-${slotIndex}`);
          if (!targetElement) {
            return;
          }
          const targetRect = targetElement.getBoundingClientRect();
          const overlaySize = start.size || targetRect.width || OVERLAY_RUNE_SIZE;
          overlayRunes.push({
            id: rune.id,
            runeType: rune.runeType,
            rune,
            size: overlaySize,
            startX: start.centerX - overlaySize / 2,
            startY: start.centerY - overlaySize / 2,
            endX: targetRect.left + targetRect.width / 2 - overlaySize / 2,
            endY: targetRect.top + targetRect.height / 2 - overlaySize / 2,
          });
        });
      }

      const previousFloorCount = snapshot.floorRuneCount;
      const newFloorCount = targetPlayer.floorLine.runes.length;
      const floorDelta = newFloorCount - previousFloorCount;
      if (floorDelta > 0 && strainCounterElement) {
        const overflowRunes = snapshot.runeOrder.slice(patternRunesUsed, patternRunesUsed + floorDelta);
        const targetRect = strainCounterElement.getBoundingClientRect();
        overflowRunes.forEach((rune) => {
          const start = snapshot.runePositions.get(rune.id);
          if (!start) {
            return;
          }
          const overlaySize = start.size || targetRect.width || OVERLAY_RUNE_SIZE;
          overlayRunes.push({
            id: rune.id,
            runeType: rune.runeType,
            rune,
            size: overlaySize,
            startX: start.centerX - overlaySize / 2,
            startY: start.centerY - overlaySize / 2,
            endX: targetRect.left + targetRect.width / 2 - overlaySize / 2,
            endY: targetRect.top + targetRect.height / 2 - overlaySize / 2,
            shouldDisappear: true,
          });
        });
      }

      if (overlayRunes.length === 0) {
        if (autoMeta?.pattern) {
          revealPatternSlots(autoMeta.pattern.playerId, autoMeta.pattern.slotKeys);
        }
        return;
      }

      autoAnimationMetaRef.current = autoMeta;
      setAnimatingRunes(overlayRunes);
    });
  }, [player, hidePatternSlots, revealPatternSlots]);

  const handlePlacementAnimationComplete = useCallback(() => {
    setAnimatingRunes([]);
    const autoMeta = autoAnimationMetaRef.current;
    if (autoMeta) {
      if (autoMeta.pattern) {
        revealPatternSlots(autoMeta.pattern.playerId, autoMeta.pattern.slotKeys);
      }
      // Note: floor slots no longer need to be revealed since FloorLine UI is removed
      autoAnimationMetaRef.current = null;
    }
  }, [revealPatternSlots]);

  useEffect(() => {
    if (selectedRunes.length === 0) {
      selectionSnapshotRef.current = null;
      return undefined;
    }
    if (typeof document === 'undefined') {
      selectionSnapshotRef.current = {
        playerId: player.id,
        runeOrder: [...selectedRunes],
        patternLineCounts: player.patternLines.map((line) => line.count),
        runePositions: new Map(),
        floorRuneCount: player.floorLine.runes.length,
      };
      return undefined;
    }

    const rafId = requestAnimationFrame(() => {
      const runePositions = captureSelectedRunePositions(selectedRunes);
      selectionSnapshotRef.current = {
        playerId: player.id,
        runeOrder: [...selectedRunes],
        patternLineCounts: player.patternLines.map((line) => line.count),
        runePositions,
        floorRuneCount: player.floorLine.runes.length,
      };
    });
    selectionMeasurementRafRef.current = rafId;
    return () => {
      if (selectionMeasurementRafRef.current !== undefined) {
        cancelAnimationFrame(selectionMeasurementRafRef.current);
      }
    };
  }, [captureSelectedRunePositions, player, selectedRunes]);

  useLayoutEffect(() => {
    const previousCount = previousSelectedCountRef.current;
    if (previousCount > 0 && selectedRunes.length === 0) {
      if (manualAnimationRef.current) {
        manualAnimationRef.current = false;
        selectionSnapshotRef.current = null;
      } else {
        triggerAutoPlacementAnimation();
      }
    }
    previousSelectedCountRef.current = selectedRunes.length;
  }, [selectedRunes.length, triggerAutoPlacementAnimation]);

  useEffect(() => {
    if (!draftSource || draftSource.type !== 'runeforge') {
      return undefined;
    }
    const movedRunes = draftSource.movedToCenter;
    if (movedRunes.length === 0) {
      lastRuneforgeAnimationKeyRef.current = null;
      runeforgeAnimationSnapshotRef.current = null;
      return undefined;
    }
    const selectionKey = `${draftSource.runeforgeId}-${movedRunes.map((rune) => rune.id).join(',')}`;
    if (lastRuneforgeAnimationKeyRef.current === selectionKey) {
      return undefined;
    }
    lastRuneforgeAnimationKeyRef.current = selectionKey;

    const rafId = requestAnimationFrame(() => {
      const runePositions = captureRuneforgeRunePositions(movedRunes);
      runeforgeAnimationSnapshotRef.current = {
        key: selectionKey,
        runes: movedRunes,
        runePositions,
      };
    });
    runeforgeMeasurementRafRef.current = rafId;
    return () => {
      if (runeforgeMeasurementRafRef.current !== undefined) {
        cancelAnimationFrame(runeforgeMeasurementRafRef.current);
      }
    };
  }, [captureRuneforgeRunePositions, draftSource]);

  useLayoutEffect(() => {
    const snapshot = runeforgeAnimationSnapshotRef.current;
    if (!snapshot) {
      return;
    }
    if (draftSource && draftSource.type === 'runeforge') {
      return;
    }
    runeforgeAnimationSnapshotRef.current = null;
  }, [draftSource]);

  useLayoutEffect(() => {
    if (!draftSource || draftSource.type !== 'runeforge') {
      lastRuneforgeAnimationKeyRef.current = null;
    }
  }, [draftSource]);

  return {
    animatingRunes,
    hiddenPatternSlots,
    isAnimatingPlacement,
    handlePlacementAnimationComplete,
  };
}
