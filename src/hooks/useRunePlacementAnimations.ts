/**
 * useRunePlacementAnimations - manages rune placement overlay animations and temporary hides
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { AnimatingRune, DraftSource, GameState, Rune } from '../types/game';
import { RUNE_SIZE_CONFIG } from '../styles/tokens';
import { getWallColumnForRune } from '../utils/scoring';

interface SelectionSnapshot {
  runeOrder: Rune[];
  patternLines: PatternLineSnapshot[];
  runePositions: Map<string, MeasuredRunePosition>;
  playerHealth: number;
  playerArmor: number;
  overloadRuneCount: number;
}

interface PatternLineSnapshot {
  tier: number;
  runeType: Rune['runeType'] | null;
  count: number;
  runes: Rune[];
  primaryRuneId: string | null;
}

interface AutoAnimationMeta {
  pattern?: string[];
  wall?: string[];
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
  overloadRuneCount: number;
}

interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PlacementAnimationPlanParams {
  snapshot: SelectionSnapshot;
  player: GameState['player'];
  overloadRuneCount: number;
  patternSlotRects: Map<string, RectLike>;
  wallCellRects: Map<string, RectLike>;
  overloadTargetRect: RectLike | null;
  deckTargetRect: RectLike | null;
}

interface PlacementAnimationPlan {
  overlayRunes: AnimatingRune[];
  patternSlotKeys: string[];
  wallSlotKeys: string[];
}

const OVERLAY_RUNE_SIZE = RUNE_SIZE_CONFIG.large.dimension;

function capturePatternLineSnapshots(player: GameState['player']): PatternLineSnapshot[] {
  return player.patternLines.map((line) => ({
    tier: line.tier,
    runeType: line.runeType,
    count: line.count,
    runes: [...(line.runes ?? [])],
    primaryRuneId: line.primaryRuneId,
  }));
}

function createDisappearingRuneAnimation(
  rune: Rune,
  start: MeasuredRunePosition,
  targetRect: RectLike,
): AnimatingRune {
  const overlaySize = start.size || targetRect.width || OVERLAY_RUNE_SIZE;
  return {
    id: rune.id,
    runeType: rune.runeType,
    rune,
    size: overlaySize,
    startX: start.centerX - overlaySize / 2,
    startY: start.centerY - overlaySize / 2,
    endX: targetRect.left + targetRect.width / 2 - overlaySize / 2,
    endY: targetRect.top + targetRect.height / 2 - overlaySize / 2,
    shouldDisappear: true,
  };
}

function createRuneAnimation(
  rune: Rune,
  start: MeasuredRunePosition,
  targetRect: RectLike,
  shouldDisappear = false,
): AnimatingRune {
  const overlaySize = start.size || targetRect.width || OVERLAY_RUNE_SIZE;
  const animation: AnimatingRune = {
    id: rune.id,
    runeType: rune.runeType,
    rune,
    size: overlaySize,
    startX: start.centerX - overlaySize / 2,
    startY: start.centerY - overlaySize / 2,
    endX: targetRect.left + targetRect.width / 2 - overlaySize / 2,
    endY: targetRect.top + targetRect.height / 2 - overlaySize / 2,
  };
  if (shouldDisappear) {
    animation.shouldDisappear = true;
  }
  return animation;
}

export function buildPlacementAnimationPlan({
  snapshot,
  player,
  overloadRuneCount,
  patternSlotRects,
  wallCellRects,
  overloadTargetRect,
  deckTargetRect,
}: PlacementAnimationPlanParams): PlacementAnimationPlan {
  const updatedPatternLines = player.patternLines;
  const previousPatternLines = snapshot.patternLines;
  const selectedRuneType = snapshot.runeOrder[0]?.runeType ?? null;
  const countIncreaseLineIndex = updatedPatternLines.findIndex((line, index) => {
    const previousLine = previousPatternLines[index];
    return previousLine ? line.count > previousLine.count : false;
  });
  let changedLineIndex = countIncreaseLineIndex;
  let previousCount = changedLineIndex !== -1 ? previousPatternLines[changedLineIndex]?.count ?? 0 : 0;
  let patternRunesUsed = 0;

  if (changedLineIndex !== -1) {
    patternRunesUsed = updatedPatternLines[changedLineIndex].count - previousCount;
  }

  if (changedLineIndex === -1 && selectedRuneType) {
    const completedLineIndex = previousPatternLines.findIndex((previousLine, index) => {
      const updatedLine = updatedPatternLines[index];
      const acceptedRuneType = previousLine.runeType ?? selectedRuneType;
      const availableSpace = previousLine.tier - previousLine.count;
      const placedCount = Math.min(snapshot.runeOrder.length, availableSpace);
      if (
        !updatedLine ||
        previousLine.runeType !== null && previousLine.runeType !== selectedRuneType ||
        previousLine.count >= previousLine.tier ||
        placedCount <= 0 ||
        previousLine.count + placedCount !== previousLine.tier ||
        updatedLine.count !== 0 ||
        updatedLine.runeType !== null ||
        acceptedRuneType !== selectedRuneType
      ) {
        return false;
      }

      const wallSize = player.wall.length;
      const wallCol = getWallColumnForRune(index, selectedRuneType, wallSize);
      return player.wall[index]?.[wallCol]?.runeType === selectedRuneType;
    });

    if (completedLineIndex !== -1) {
      changedLineIndex = completedLineIndex;
      previousCount = previousPatternLines[completedLineIndex].count;
      const availableSpace = previousPatternLines[completedLineIndex].tier - previousCount;
      patternRunesUsed = Math.min(snapshot.runeOrder.length, availableSpace);
    }
  }

  const patternSlotKeys: string[] = [];
  const wallSlotKeys: string[] = [];
  const overlayRunes: AnimatingRune[] = [];
  const castRuneIds = new Set<string>();
  const selectedRunesToPatternSlots: Array<{ rune: Rune; slotKey: string }> = [];

  previousPatternLines.forEach((previousLine, lineIndex) => {
    const updatedLine = updatedPatternLines[lineIndex];
    const runeType = previousLine.runeType ?? selectedRuneType;
    if (!updatedLine || !runeType || updatedLine.count !== 0 || updatedLine.runeType !== null) {
      return;
    }

    const wallCol = getWallColumnForRune(lineIndex, runeType, player.wall.length);
    if (player.wall[lineIndex]?.[wallCol]?.runeType !== runeType) {
      return;
    }

    const selectedRunesOnLine = lineIndex === changedLineIndex
      ? snapshot.runeOrder.slice(0, patternRunesUsed)
      : [];
    const fullLineRunes = [...previousLine.runes, ...selectedRunesOnLine];
    if (fullLineRunes.length === 0) {
      return;
    }

    const castRuneId = previousLine.primaryRuneId ?? fullLineRunes[0]?.id ?? null;
    const wallSlotKey = `${lineIndex}-${wallCol}`;
    const wallTargetRect = wallCellRects.get(wallSlotKey);

    fullLineRunes.forEach((rune, fullLineSlotIndex) => {
      castRuneIds.add(rune.id);
      const isSelectedRune = selectedRunesOnLine.some((selectedRune) => selectedRune.id === rune.id);
      const slotKey = `${lineIndex}-${fullLineSlotIndex}`;
      const slotRect = patternSlotRects.get(slotKey);
      const start = isSelectedRune
        ? snapshot.runePositions.get(rune.id) ?? null
        : (slotRect
          ? {
              centerX: slotRect.left + slotRect.width / 2,
              centerY: slotRect.top + slotRect.height / 2,
              size: slotRect.width || OVERLAY_RUNE_SIZE,
            }
          : null);
      if (!start) {
        return;
      }

      if (rune.id === castRuneId) {
        if (wallTargetRect) {
          wallSlotKeys.push(wallSlotKey);
          overlayRunes.push(createRuneAnimation(rune, start, wallTargetRect));
        }
        return;
      }

      if (deckTargetRect) {
        overlayRunes.push(createDisappearingRuneAnimation(rune, start, deckTargetRect));
      }
    });
  });

  if (changedLineIndex !== -1 && patternRunesUsed > 0) {
    for (let offset = 0; offset < patternRunesUsed; offset += 1) {
      const slotIndex = previousCount + offset;
      const slotKey = `${changedLineIndex}-${slotIndex}`;

      const rune = snapshot.runeOrder[offset];
      if (castRuneIds.has(rune.id)) {
        continue;
      }

      patternSlotKeys.push(slotKey);
      selectedRunesToPatternSlots.push({ rune, slotKey });
    }
  }

  selectedRunesToPatternSlots.forEach(({ rune, slotKey }) => {
      const start = snapshot.runePositions.get(rune.id);
      const targetRect = patternSlotRects.get(slotKey);
      if (!start || !targetRect) {
        return;
      }
      overlayRunes.push(createRuneAnimation(rune, start, targetRect));
  });

  const hasManualOverloadStateChange =
    changedLineIndex === -1 &&
    (
      overloadRuneCount > snapshot.overloadRuneCount ||
      player.health !== snapshot.playerHealth ||
      player.armor !== snapshot.playerArmor
    );
  const overloadRunes = changedLineIndex !== -1
    ? snapshot.runeOrder.slice(patternRunesUsed)
    : (hasManualOverloadStateChange ? snapshot.runeOrder : []);

  if (overloadTargetRect) {
    overloadRunes.forEach((rune) => {
      const start = snapshot.runePositions.get(rune.id);
      if (!start) {
        return;
      }
      overlayRunes.push(createDisappearingRuneAnimation(rune, start, overloadTargetRect));
    });
  }

  return { overlayRunes, patternSlotKeys, wallSlotKeys };
}

export function useRunePlacementAnimations({
  player,
  selectedRunes,
  draftSource,
  overloadRuneCount,
}: UseRunePlacementAnimationsParams) {
  const [animatingRunes, setAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [runeforgeAnimatingRunes, setRuneforgeAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [hiddenPatternSlots, setHiddenPatternSlots] = useState<Set<string>>(new Set());
  const [hiddenWallSlots, setHiddenWallSlots] = useState<Set<string>>(new Set());
  const [hiddenCenterRuneIds, setHiddenCenterRuneIds] = useState<Set<string>>(new Set());
  const manualAnimationRef = useRef(false);
  const selectionSnapshotRef = useRef<SelectionSnapshot | null>(null);
  const previousSelectedCountRef = useRef<number>(selectedRunes.length);
  const autoAnimationMetaRef = useRef<AutoAnimationMeta | null>(null);
  const runeforgeAnimationMetaRef = useRef<{ runeIds: string[] } | null>(null);
  const lastRuneforgeAnimationKeyRef = useRef<string | null>(null);
  const selectionMeasurementRafRef = useRef<number | undefined>(undefined);

  const isAnimatingPlacement = animatingRunes.length > 0;
  const activeAnimatingRunes = useMemo(
    () => [...animatingRunes, ...runeforgeAnimatingRunes],
    [animatingRunes, runeforgeAnimatingRunes],
  );

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

  const hideWallSlots = useCallback((slotKeys: string[]) => {
    if (slotKeys.length === 0) {
      return;
    }
    setHiddenWallSlots((prev) => {
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

  const revealWallSlots = useCallback((slotKeys: string[]) => {
    if (slotKeys.length === 0) {
      return;
    }
    setHiddenWallSlots((prev) => {
      const nextSet = new Set(prev);
      slotKeys.forEach((key) => nextSet.delete(key));
      return nextSet;
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

  const triggerAutoPlacementAnimation = useCallback(() => {
    const snapshot = selectionSnapshotRef.current;
    selectionSnapshotRef.current = null;
    if (!snapshot || typeof document === 'undefined') {
      return;
    }

    const patternSlotLookup = new Map<string, HTMLElement>();
    const candidates = document.querySelectorAll<HTMLElement>('[data-pattern-line-index][data-pattern-slot-index]');
    candidates.forEach((element) => {
      const lineIndex = element.getAttribute('data-pattern-line-index');
      const slotIndex = element.getAttribute('data-pattern-slot-index');
      if (lineIndex !== null && slotIndex !== null) {
        patternSlotLookup.set(`${lineIndex}-${slotIndex}`, element);
      }
    });
    const wallCellLookup = new Map<string, HTMLElement>();
    const wallCellCandidates = document.querySelectorAll<HTMLElement>('[data-wall-row][data-wall-col]');
    wallCellCandidates.forEach((element) => {
      const row = element.getAttribute('data-wall-row');
      const col = element.getAttribute('data-wall-col');
      if (row !== null && col !== null) {
        wallCellLookup.set(`${row}-${col}`, element);
      }
    });

    requestAnimationFrame(() => {
      const patternSlotRects = new Map<string, RectLike>();
      patternSlotLookup.forEach((element, key) => {
        patternSlotRects.set(key, element.getBoundingClientRect());
      });
      const wallCellRects = new Map<string, RectLike>();
      wallCellLookup.forEach((element, key) => {
        wallCellRects.set(key, element.getBoundingClientRect());
      });
      const overloadTargetRect = document
        .querySelector<HTMLElement>('[data-strain-counter="true"]')
        ?.getBoundingClientRect() ?? null;
      const deckTargetRect = document
        .querySelector<HTMLElement>('[data-deck-counter="true"]')
        ?.getBoundingClientRect() ?? null;
      const { overlayRunes, patternSlotKeys, wallSlotKeys } = buildPlacementAnimationPlan({
        snapshot,
        player,
        overloadRuneCount,
        patternSlotRects,
        wallCellRects,
        overloadTargetRect,
        deckTargetRect,
      });

      let autoMeta: AutoAnimationMeta | null = null;
      if (patternSlotKeys.length > 0) {
        const animatedPatternSlotKeys = patternSlotKeys.filter((slotKey) =>
          overlayRunes.some((rune) => !rune.shouldDisappear && patternSlotRects.has(slotKey)),
        );
        if (animatedPatternSlotKeys.length > 0) {
          hidePatternSlots(animatedPatternSlotKeys);
          autoMeta = { pattern: animatedPatternSlotKeys };
        }
      }
      if (wallSlotKeys.length > 0) {
        const animatedWallSlotKeys = wallSlotKeys.filter((slotKey) =>
          overlayRunes.some((rune) => !rune.shouldDisappear && wallCellRects.has(slotKey)),
        );
        if (animatedWallSlotKeys.length > 0) {
          hideWallSlots(animatedWallSlotKeys);
          autoMeta = { ...autoMeta, wall: animatedWallSlotKeys };
        }
      }

      if (overlayRunes.length === 0) {
        if (autoMeta?.pattern) {
          revealPatternSlots(autoMeta.pattern);
        }
        if (autoMeta?.wall) {
          revealWallSlots(autoMeta.wall);
        }
        return;
      }

      autoAnimationMetaRef.current = autoMeta;
      setAnimatingRunes(overlayRunes);
    });
  }, [player, overloadRuneCount, hidePatternSlots, hideWallSlots, revealPatternSlots, revealWallSlots]);

  const handlePlacementAnimationComplete = useCallback(() => {
    const autoMeta = autoAnimationMetaRef.current;
    if (autoMeta) {
      if (autoMeta.pattern) {
        revealPatternSlots(autoMeta.pattern);
      }
      if (autoMeta.wall) {
        revealWallSlots(autoMeta.wall);
      }
      autoAnimationMetaRef.current = null;
    }
    setAnimatingRunes([]);
  }, [revealPatternSlots, revealWallSlots]);

  const handleRuneforgeAnimationComplete = useCallback(() => {
    const runeIds = runeforgeAnimationMetaRef.current?.runeIds ?? [];
    runeforgeAnimationMetaRef.current = null;
    setRuneforgeAnimatingRunes([]);
    if (runeIds.length > 0) {
      revealCenterRunes(runeIds);
    }
  }, [revealCenterRunes]);

  useEffect(() => {
    if (selectedRunes.length === 0) {
      selectionSnapshotRef.current = null;
      return undefined;
    }
    if (typeof document === 'undefined') {
      selectionSnapshotRef.current = {
        runeOrder: [...selectedRunes],
        patternLines: capturePatternLineSnapshots(player),
        runePositions: new Map(),
        playerHealth: player.health,
        playerArmor: player.armor,
        overloadRuneCount,
      };
      return undefined;
    }

    const rafId = requestAnimationFrame(() => {
      const runePositions = captureSelectedRunePositions(selectedRunes);
      selectionSnapshotRef.current = {
        runeOrder: [...selectedRunes],
        patternLines: capturePatternLineSnapshots(player),
        runePositions,
        playerHealth: player.health,
        playerArmor: player.armor,
        overloadRuneCount,
      };
    });
    selectionMeasurementRafRef.current = rafId;
    return () => {
      if (selectionMeasurementRafRef.current !== undefined) {
        cancelAnimationFrame(selectionMeasurementRafRef.current);
      }
    };
  }, [captureSelectedRunePositions, overloadRuneCount, player, selectedRunes]);

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
    hiddenWallSlots,
    hiddenCenterRuneIds,
    isAnimatingPlacement,
    handlePlacementAnimationComplete,
    handleRuneforgeAnimationComplete,
  };
}
