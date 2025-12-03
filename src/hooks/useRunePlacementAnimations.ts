/**
 * useRunePlacementAnimations - manages rune placement overlay animations and temporary hides
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AnimatingRune, GameState, Rune } from '../types/game';

interface SelectionSnapshot {
  playerId: string;
  playerIndex: number;
  runeOrder: Rune[];
  patternLineCounts: number[];
  runePositions: Map<string, { startX: number; startY: number }>;
  floorRuneCount: number;
}

interface AutoAnimationMeta {
  pattern?: { playerId: string; slotKeys: string[] };
  floor?: { playerId: string; slotIndexes: number[] };
}

interface RuneforgeAnimationSnapshot {
  key: string;
  runes: Rune[];
  runePositions: Map<string, { startX: number; startY: number }>;
}

interface UseRunePlacementAnimationsParams {
  players: GameState['players'];
  currentPlayerIndex: number;
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
  centerPool: GameState['centerPool'];
}

const OVERLAY_RUNE_SIZE = 48;

export function useRunePlacementAnimations({
  players,
  currentPlayerIndex,
  selectedRunes,
  draftSource,
  centerPool,
}: UseRunePlacementAnimationsParams) {
  const [animatingRunes, setAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [runeforgeAnimatingRunes, setRuneforgeAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [hiddenPatternSlots, setHiddenPatternSlots] = useState<Record<string, Set<string>>>({});
  const [hiddenFloorSlots, setHiddenFloorSlots] = useState<Record<string, Set<number>>>({});
  const [hiddenCenterRuneIds, setHiddenCenterRuneIds] = useState<Set<string>>(new Set());
  const manualAnimationRef = useRef(false);
  const selectionSnapshotRef = useRef<SelectionSnapshot | null>(null);
  const previousSelectedCountRef = useRef<number>(selectedRunes.length);
  const autoAnimationMetaRef = useRef<AutoAnimationMeta | null>(null);
  const runeforgeAnimationMetaRef = useRef<{ runeIds: string[] } | null>(null);
  const lastRuneforgeAnimationKeyRef = useRef<string | null>(null);
  const runeforgeAnimationSnapshotRef = useRef<RuneforgeAnimationSnapshot | null>(null);

  const isAnimatingPlacement = animatingRunes.length > 0;
  const activeAnimatingRunes = useMemo(
    () => [...animatingRunes, ...runeforgeAnimatingRunes],
    [animatingRunes, runeforgeAnimatingRunes],
  );
  const animatingRuneIds = useMemo(
    () => activeAnimatingRunes.map((rune) => rune.id),
    [activeAnimatingRunes],
  );

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

  const hideFloorSlots = useCallback((playerId: string, slotIndexes: number[]) => {
    if (slotIndexes.length === 0) {
      return;
    }
    setHiddenFloorSlots((prev) => {
      const playerSet = prev[playerId] ? new Set(prev[playerId]) : new Set<number>();
      slotIndexes.forEach((index) => playerSet.add(index));
      return {
        ...prev,
        [playerId]: playerSet,
      };
    });
  }, []);

  const revealFloorSlots = useCallback((playerId: string, slotIndexes: number[]) => {
    if (slotIndexes.length === 0) {
      return;
    }
    setHiddenFloorSlots((prev) => {
      const playerSet = prev[playerId];
      if (!playerSet) {
        return prev;
      }
      const nextSet = new Set(playerSet);
      slotIndexes.forEach((index) => nextSet.delete(index));
      const nextState = { ...prev };
      if (nextSet.size === 0) {
        delete nextState[playerId];
      } else {
        nextState[playerId] = nextSet;
      }
      return nextState;
    });
  }, []);

  const hideCenterRunes = useCallback((runeIds: string[]) => {
    if (runeIds.length === 0) {
      return;
    }
    setHiddenCenterRuneIds((prev) => {
      const nextSet = new Set(prev);
      let changed = false;
      runeIds.forEach((id) => {
        if (!nextSet.has(id)) {
          nextSet.add(id);
          changed = true;
        }
      });
      return changed ? nextSet : prev;
    });
  }, []);

  const revealCenterRunes = useCallback((runeIds: string[]) => {
    if (runeIds.length === 0) {
      return;
    }
    setHiddenCenterRuneIds((prev) => {
      if (prev.size === 0) {
        return prev;
      }
      const nextSet = new Set(prev);
      let changed = false;
      runeIds.forEach((id) => {
        if (nextSet.delete(id)) {
          changed = true;
        }
      });
      return changed ? nextSet : prev;
    });
  }, []);

  const captureSelectedRunePositions = (runes: Rune[]): Map<string, { startX: number; startY: number }> => {
    const positions = new Map<string, { startX: number; startY: number }>();
    if (typeof document === 'undefined') {
      return positions;
    }
    runes.forEach((rune) => {
      const runeElement = document.querySelector<HTMLElement>(`[data-selected-rune="true"][data-rune-id="${rune.id}"]`);
      if (!runeElement) {
        return;
      }
      const rect = runeElement.getBoundingClientRect();
      positions.set(rune.id, {
        startX: rect.left + rect.width / 2 - OVERLAY_RUNE_SIZE / 2,
        startY: rect.top + rect.height / 2 - OVERLAY_RUNE_SIZE / 2,
      });
    });
    return positions;
  };

  const captureRuneforgeRunePositions = useCallback((runes: Rune[]): Map<string, { startX: number; startY: number }> => {
    const positions = new Map<string, { startX: number; startY: number }>();
    if (typeof document === 'undefined') {
      return positions;
    }
    runes.forEach((rune) => {
      const runeElement = document.querySelector<HTMLElement>(`[data-rune-id="${rune.id}"][data-rune-source="runeforge"]`);
      if (!runeElement) {
        return;
      }
      const rect = runeElement.getBoundingClientRect();
      positions.set(rune.id, {
        startX: rect.left + rect.width / 2 - OVERLAY_RUNE_SIZE / 2,
        startY: rect.top + rect.height / 2 - OVERLAY_RUNE_SIZE / 2,
      });
    });
    return positions;
  }, []);

  const triggerAutoPlacementAnimation = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const snapshot = selectionSnapshotRef.current;
    selectionSnapshotRef.current = null;
    if (!snapshot) {
      return;
    }
    const targetPlayer = players.find((player) => player.id === snapshot.playerId);
    if (!targetPlayer) {
      return;
    }
    const updatedCounts = targetPlayer.patternLines.map((line) => line.count);
    const previousCounts = snapshot.patternLineCounts;
    const changedLineIndex = updatedCounts.findIndex((count, index) => count > (previousCounts[index] ?? 0));
    const overlayRunes: AnimatingRune[] = [];
    const patternSlotKeys: string[] = [];
    let patternRunesUsed = 0;

    if (changedLineIndex !== -1) {
      const placedCount = updatedCounts[changedLineIndex] - (previousCounts[changedLineIndex] ?? 0);
      if (placedCount > 0) {
        const runesToAnimate = snapshot.runeOrder.slice(0, placedCount);
        runesToAnimate.forEach((rune, offset) => {
          const start = snapshot.runePositions.get(rune.id);
          if (!start) {
            return;
          }
          const slotIndex = (previousCounts[changedLineIndex] ?? 0) + offset;
          const selector = `[data-player-id="${snapshot.playerId}"][data-pattern-line-index="${changedLineIndex}"][data-pattern-slot-index="${slotIndex}"]`;
          const targetElement = document.querySelector<HTMLElement>(selector);
          if (!targetElement) {
            return;
          }
          const targetRect = targetElement.getBoundingClientRect();
          overlayRunes.push({
            id: rune.id,
            runeType: rune.runeType,
            startX: start.startX,
            startY: start.startY,
            endX: targetRect.left + targetRect.width / 2 - OVERLAY_RUNE_SIZE / 2,
            endY: targetRect.top + targetRect.height / 2 - OVERLAY_RUNE_SIZE / 2,
          });
          patternSlotKeys.push(`${changedLineIndex}-${slotIndex}`);
        });
        patternRunesUsed = placedCount;
      }
    }

    const previousFloorCount = snapshot.floorRuneCount;
    const newFloorCount = targetPlayer.floorLine.runes.length;
    const floorDelta = newFloorCount - previousFloorCount;
    const floorSlotIndexes: number[] = [];
    if (floorDelta > 0) {
      const overflowRunes = snapshot.runeOrder.slice(patternRunesUsed, patternRunesUsed + floorDelta);
      overflowRunes.forEach((rune, offset) => {
        const start = snapshot.runePositions.get(rune.id);
        if (!start) {
          return;
        }
        const slotIndex = previousFloorCount + offset;
        const selector = `[data-player-id="${snapshot.playerId}"][data-floor-slot-index="${slotIndex}"]`;
        const targetElement = document.querySelector<HTMLElement>(selector);
        if (!targetElement) {
          return;
        }
        const targetRect = targetElement.getBoundingClientRect();
        overlayRunes.push({
          id: rune.id,
          runeType: rune.runeType,
          startX: start.startX,
          startY: start.startY,
          endX: targetRect.left + targetRect.width / 2 - OVERLAY_RUNE_SIZE / 2,
          endY: targetRect.top + targetRect.height / 2 - OVERLAY_RUNE_SIZE / 2,
        });
        floorSlotIndexes.push(slotIndex);
      });
    }

    if (overlayRunes.length === 0) {
      return;
    }

    const meta: AutoAnimationMeta = {};
    if (patternSlotKeys.length > 0) {
      hidePatternSlots(snapshot.playerId, patternSlotKeys);
      meta.pattern = { playerId: snapshot.playerId, slotKeys: patternSlotKeys };
    }
    if (floorSlotIndexes.length > 0) {
      hideFloorSlots(snapshot.playerId, floorSlotIndexes);
      meta.floor = { playerId: snapshot.playerId, slotIndexes: floorSlotIndexes };
    }
    autoAnimationMetaRef.current = Object.keys(meta).length > 0 ? meta : null;
    setAnimatingRunes(overlayRunes);
  }, [players, hidePatternSlots, hideFloorSlots]);

  const animateRuneforgeToCenter = useCallback(
    (snapshot: RuneforgeAnimationSnapshot) => {
      const runes = snapshot.runes;
      const runeIds = runes.map((rune) => rune.id);
      if (runes.length === 0) {
        return;
      }
      if (typeof document === 'undefined') {
        revealCenterRunes(runeIds);
        return;
      }
      requestAnimationFrame(() => {
        const overlayRunes: AnimatingRune[] = [];
        runes.forEach((rune) => {
          const start = snapshot.runePositions.get(rune.id);
          const targetElement = document.querySelector<HTMLElement>(`[data-rune-id="${rune.id}"][data-rune-source="center"]`);
          if (!start || !targetElement) {
            return;
          }
          const targetRect = targetElement.getBoundingClientRect();
          overlayRunes.push({
            id: rune.id,
            runeType: rune.runeType,
            startX: start.startX,
            startY: start.startY,
            endX: targetRect.left + targetRect.width / 2 - OVERLAY_RUNE_SIZE / 2,
            endY: targetRect.top + targetRect.height / 2 - OVERLAY_RUNE_SIZE / 2,
          });
        });
        if (overlayRunes.length === 0) {
          revealCenterRunes(runeIds);
          runeforgeAnimationMetaRef.current = null;
          return;
        }
        runeforgeAnimationMetaRef.current = { runeIds };
        setRuneforgeAnimatingRunes(overlayRunes);
      });
    },
    [revealCenterRunes],
  );

  const handlePlacementAnimationComplete = useCallback(() => {
    setAnimatingRunes([]);
    const autoMeta = autoAnimationMetaRef.current;
    if (autoMeta) {
      if (autoMeta.pattern) {
        revealPatternSlots(autoMeta.pattern.playerId, autoMeta.pattern.slotKeys);
      }
      if (autoMeta.floor) {
        revealFloorSlots(autoMeta.floor.playerId, autoMeta.floor.slotIndexes);
      }
      autoAnimationMetaRef.current = null;
    }
  }, [revealFloorSlots, revealPatternSlots]);

  const handleRuneforgeAnimationComplete = useCallback(() => {
    const runeIds = runeforgeAnimationMetaRef.current?.runeIds ?? [];
    runeforgeAnimationMetaRef.current = null;
    setRuneforgeAnimatingRunes([]);
    if (runeIds.length > 0) {
      revealCenterRunes(runeIds);
    }
  }, [revealCenterRunes]);

  useLayoutEffect(() => {
    if (selectedRunes.length === 0) {
      return;
    }
    const runePositions = captureSelectedRunePositions(selectedRunes);
    selectionSnapshotRef.current = {
      playerId: players[currentPlayerIndex].id,
      playerIndex: currentPlayerIndex,
      runeOrder: [...selectedRunes],
      patternLineCounts: players[currentPlayerIndex].patternLines.map((line) => line.count),
      runePositions,
      floorRuneCount: players[currentPlayerIndex].floorLine.runes.length,
    };
  }, [selectedRunes, players, currentPlayerIndex]);

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

  useLayoutEffect(() => {
    if (!draftSource || draftSource.type !== 'runeforge') {
      return;
    }
    const movedRunes = draftSource.movedToCenter;
    if (movedRunes.length === 0) {
      lastRuneforgeAnimationKeyRef.current = null;
      runeforgeAnimationSnapshotRef.current = null;
      return;
    }
    const selectionKey = `${draftSource.runeforgeId}-${movedRunes.map((rune) => rune.id).join(',')}`;
    if (lastRuneforgeAnimationKeyRef.current === selectionKey) {
      return;
    }
    lastRuneforgeAnimationKeyRef.current = selectionKey;
    const runePositions = captureRuneforgeRunePositions(movedRunes);
    runeforgeAnimationSnapshotRef.current = {
      key: selectionKey,
      runes: movedRunes,
      runePositions,
    };
    hideCenterRunes(movedRunes.map((rune) => rune.id));
  }, [draftSource, hideCenterRunes, captureRuneforgeRunePositions]);

  useLayoutEffect(() => {
    const snapshot = runeforgeAnimationSnapshotRef.current;
    if (!snapshot) {
      return;
    }
    if (draftSource && draftSource.type === 'runeforge') {
      return;
    }
    const runeIds = snapshot.runes.map((rune) => rune.id);
    const centerHasRunes = runeIds.every((runeId) => centerPool.some((rune) => rune.id === runeId));
    runeforgeAnimationSnapshotRef.current = null;
    if (!centerHasRunes) {
      revealCenterRunes(runeIds);
      return;
    }
    animateRuneforgeToCenter(snapshot);
  }, [draftSource, centerPool, animateRuneforgeToCenter, revealCenterRunes]);

  useLayoutEffect(() => {
    if (!draftSource || draftSource.type !== 'runeforge') {
      lastRuneforgeAnimationKeyRef.current = null;
    }
  }, [draftSource]);

  return {
    animatingRunes,
    runeforgeAnimatingRunes,
    activeAnimatingRunes,
    animatingRuneIds,
    hiddenPatternSlots,
    hiddenFloorSlots,
    hiddenCenterRuneIds,
    isAnimatingPlacement,
    handlePlacementAnimationComplete,
    handleRuneforgeAnimationComplete,
  };
}
