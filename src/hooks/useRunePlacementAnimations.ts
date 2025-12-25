/**
 * useRunePlacementAnimations - manages rune placement overlay animations and temporary hides
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AnimatingRune, DraftSource, GameState, Rune } from '../types/game';
import { RUNE_SIZE_CONFIG } from '../styles/tokens';
import { useUIStore } from '../state/stores/uiStore';

interface SelectionSnapshot {
  runeOrder: Rune[];
  patternLineCounts: number[];
  runePositions: Map<string, MeasuredRunePosition>;
  floorRuneCount: number;
}

interface AutoAnimationMeta {
  pattern?: string[];
  floor?: number[];
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
  draftSource: DraftSource | null;
}

const OVERLAY_RUNE_SIZE = RUNE_SIZE_CONFIG.large.dimension;

export function useRunePlacementAnimations({
  player,
  selectedRunes,
  draftSource,
}: UseRunePlacementAnimationsParams) {
  const [animatingRunes, setAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [runeforgeAnimatingRunes, setRuneforgeAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [hiddenPatternSlots, setHiddenPatternSlots] = useState<Set<string>>(new Set());
  const [hiddenCenterRuneIds, setHiddenCenterRuneIds] = useState<Set<string>>(new Set());
  const setAnimatingRuneIds = useUIStore((state) => state.setAnimatingRuneIds);
  const setIsPlacementAnimating = useUIStore((state) => state.setIsPlacementAnimating);
  const manualAnimationRef = useRef(false);
  const selectionSnapshotRef = useRef<SelectionSnapshot | null>(null);
  const previousSelectedCountRef = useRef<number>(selectedRunes.length);
  const autoAnimationMetaRef = useRef<AutoAnimationMeta | null>(null);
  const runeforgeAnimationMetaRef = useRef<{ runeIds: string[] } | null>(null);
  const lastRuneforgeAnimationKeyRef = useRef<string | null>(null);
  const runeforgeAnimationSnapshotRef = useRef<RuneforgeAnimationSnapshot | null>(null);
  const selectionMeasurementRafRef = useRef<number | undefined>(undefined);
  const runeforgeMeasurementRafRef = useRef<number | undefined>(undefined);

  const isAnimatingPlacement = animatingRunes.length > 0;
  const activeAnimatingRunes = useMemo(
    () => [...animatingRunes, ...runeforgeAnimatingRunes],
    [animatingRunes, runeforgeAnimatingRunes],
  );
  const animatingRuneIdSet = useMemo(
    () => new Set(activeAnimatingRunes.map((rune) => rune.id)),
    [activeAnimatingRunes],
  );

  useEffect(() => {
    setIsPlacementAnimating(isAnimatingPlacement);
  }, [isAnimatingPlacement, setIsPlacementAnimating]);

  const hidePatternSlots = useCallback((slotKeys: string[]) => {
    if (slotKeys.length === 0) {
      return;
    }
    setHiddenPatternSlots((prev) => {
      const nextSet = new Set(prev);
      let changed = false;
      slotKeys.forEach((key) => {
        if (!nextSet.has(key)) {
          nextSet.add(key);
          changed = true;
        }
      });
      return changed ? nextSet : prev;
    });
  }, []);

  const revealPatternSlots = useCallback((slotKeys: string[]) => {
    if (slotKeys.length === 0) {
      return;
    }
    setHiddenPatternSlots((prev) => {
      const nextSet = new Set(prev);
      slotKeys.forEach((key) => nextSet.delete(key));
      return nextSet;
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
      hidePatternSlots(patternSlotKeys);
      autoMeta = { pattern: patternSlotKeys };
    }

    const patternSlotLookup = new Map<string, HTMLElement>();
    if (changedLineIndex !== -1) {
      const candidates = document.querySelectorAll<HTMLElement>(
        `[data-player-id="player-1"][data-pattern-line-index="${changedLineIndex}"][data-pattern-slot-index]`,//TODO: Just use a static ID
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
      `[data-player-id="player-1"][data-strain-counter="true"]`,
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
          revealPatternSlots(autoMeta.pattern);
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
        revealPatternSlots(autoMeta.pattern);
      }
      // Note: floor slots no longer need to be revealed since FloorLine UI is removed
      autoAnimationMetaRef.current = null;
    }
  }, [revealPatternSlots]);

  const handleRuneforgeAnimationComplete = useCallback(() => {
    const runeIds = runeforgeAnimationMetaRef.current?.runeIds ?? [];
    runeforgeAnimationMetaRef.current = null;
    setRuneforgeAnimatingRunes([]);
    if (runeIds.length > 0) {
      revealCenterRunes(runeIds);
    }
  }, [revealCenterRunes]);

  useEffect(() => {
    setAnimatingRuneIds(animatingRuneIdSet);
  }, [animatingRuneIdSet, setAnimatingRuneIds]);

  useEffect(() => {
    return () => {
      setAnimatingRuneIds(new Set());
    };
  }, [setAnimatingRuneIds]);

  useEffect(() => {
    if (selectedRunes.length === 0) {
      selectionSnapshotRef.current = null;
      return undefined;
    }
    if (typeof document === 'undefined') {
      selectionSnapshotRef.current = {
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

  useLayoutEffect(() => {
    if (!draftSource) {
      lastRuneforgeAnimationKeyRef.current = null;
    }
  }, [draftSource]);

  return {
    animatingRunes,
    runeforgeAnimatingRunes,
    activeAnimatingRunes,
    hiddenPatternSlots,
    hiddenCenterRuneIds,
    isAnimatingPlacement,
    handlePlacementAnimationComplete,
    handleRuneforgeAnimationComplete,
  };
}
