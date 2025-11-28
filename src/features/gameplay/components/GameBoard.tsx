/**
 * GameBoard component - main game board displaying runeforges, center, player and opponent views
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { GameState, RuneType, AnimatingRune, Rune } from '../../../types/game';
import { RuneforgesAndCenter } from './Center/RuneforgesAndCenter';
import { PlayerView } from './Player/PlayerView';
import { OpponentView } from './Player/OpponentView';
import { GameOverModal } from './GameOverModal';
import { SoloGameOverModal } from './SoloGameOverModal';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { GameLogOverlay } from './GameLogOverlay';
import { SoloStats } from './Player/SoloStats';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useBackgroundMusic } from '../../../hooks/useBackgroundMusic';
import { useFreezeSound } from '../../../hooks/useFreezeSound';
import { useVoidEffectSound } from '../../../hooks/useVoidEffectSound';
import { useUIStore } from '../../../state/stores/uiStore';
import { getControllerForIndex } from '../../../utils/playerControllers';
import { calculateEffectiveFloorPenalty, calculateProjectedPower } from '../../../utils/scoring';
import { copyRuneEffects, getPassiveEffectValue, getRuneEffectsForType } from '../../../utils/runeEffects';

const BOARD_BASE_SIZE = 1200;
const BOARD_PADDING = 80;
const MIN_BOARD_SCALE = 0.55;
const MIN_AVAILABLE_SIZE = 520;

const computeBoardScale = (width: number, height: number): number => {
  const shortestSide = Math.min(width, height);
  const available = Math.max(shortestSide - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const rawScale = available / BOARD_BASE_SIZE;
  const clamped = Math.min(rawScale, 1);
  return Math.max(clamped, MIN_BOARD_SCALE);
};
const OVERLAY_RUNE_SIZE = 48;

interface SelectionSnapshot {
  playerId: string;
  playerIndex: number;
  runeOrder: Rune[];
  patternLineCounts: number[];
  runePositions: Map<string, { startX: number; startY: number }>;
  floorRuneCount: number;
}

type PendingPlacementTarget =
  | { type: 'pattern'; index: number }
  | { type: 'floor' }
  | null;

interface AutoAnimationMeta {
  pattern?: { playerId: string; slotKeys: string[] };
  floor?: { playerId: string; slotIndexes: number[] };
}

interface RuneforgeAnimationSnapshot {
  key: string;
  runes: Rune[];
  runePositions: Map<string, { startX: number; startY: number }>;
}

interface GameBoardProps {
  gameState: GameState;
}

export function GameBoard({ gameState }: GameBoardProps) {
  const { players, runeforges, centerPool, currentPlayerIndex, selectedRunes, turnPhase, voidEffectPending, frostEffectPending, frozenPatternLines, gameMode, shouldTriggerEndRound, scoringPhase, draftSource, round, strain } = gameState;
  const isSoloMode = gameState.matchType === 'solo';
  const soloOutcome = isSoloMode ? gameState.soloOutcome : null;
  const runePowerTotal = gameState.runePowerTotal;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor, cancelSelection, skipVoidEffect, skipFrostEffect } = useGameActions();
  const returnToStartScreen = useGameplayStore((state) => state.returnToStartScreen);
  const destroyRune = useGameplayStore((state) => state.destroyRune);
  const freezePatternLine = useGameplayStore((state) => state.freezePatternLine);
  const endRound = useGameplayStore((state) => state.endRound);
  const processScoringStep = useGameplayStore((state) => state.processScoringStep);
  const soundVolume = useUIStore((state) => state.soundVolume);
  const setSoundVolume = useUIStore((state) => state.setSoundVolume);
  
  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [showDeckOverlay, setShowDeckOverlay] = useState(false);
  const [showLogOverlay, setShowLogOverlay] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem('musicMuted') === 'true';
  });
  const [animatingRunes, setAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [runeforgeAnimatingRunes, setRuneforgeAnimatingRunes] = useState<AnimatingRune[]>([]);
  const [pendingPlacementTarget, setPendingPlacementTarget] = useState<PendingPlacementTarget>(null);
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
  
  const isDraftPhase = turnPhase === 'draft';
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  const currentPlayer = players[currentPlayerIndex];
  const currentController = getControllerForIndex(gameState, currentPlayerIndex);
  const isAITurn = currentController.type === 'computer';
  const isAnimatingPlacement = animatingRunes.length > 0;
  const animatingRuneIds = [...animatingRunes, ...runeforgeAnimatingRunes].map((rune) => rune.id);
  useRunePlacementSounds(players, animatingRunes, soundVolume);
  useBackgroundMusic(!isMusicMuted, soundVolume);
  useFreezeSound(frozenPatternLines);
  useVoidEffectSound(voidEffectPending, runeforges, centerPool);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('musicMuted', isMusicMuted ? 'true' : 'false');
  }, [isMusicMuted]);

  // Determine winner by highest remaining health
  const winner = !isSoloMode && isGameOver
    ? players[0].health > players[1].health
      ? players[0]
      : players[1].health > players[0].health
        ? players[1]
        : null
    : null;

  const overloadPenalty = isSoloMode
    ? calculateEffectiveFloorPenalty(
        players[0].floorLine.runes,
        players[0].patternLines,
        players[0].wall,
        gameMode
      )
    : 0;
  const overloadMultiplier = isSoloMode ? strain : 0;
  const overloadDamagePreview = overloadPenalty * overloadMultiplier;
  const soloStats = isSoloMode
    ? (() => {
        const player = players[0];
        const completedPatternLines = player.patternLines
          .map((line, index) => ({ line, row: index }))
          .filter(({ line }) => line.count === line.tier && line.runeType !== null)
          .map(({ line, row }) => ({
            row,
            runeType: line.runeType!,
            effects: copyRuneEffects(line.firstRuneEffects ?? getRuneEffectsForType(line.runeType!)),
          }));

        const healingAmount = gameMode === 'standard'
          ? player.wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'Healing'), 0) +
            completedPatternLines.reduce((total, line) => total + getPassiveEffectValue(line.effects, 'Healing'), 0)
          : 0;

        const floorPenaltyCount = overloadPenalty;
        const windMitigationCount = gameMode === 'standard'
          ? player.wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'FloorPenaltyMitigation'), 0) +
            completedPatternLines.reduce((total, line) => total + getPassiveEffectValue(line.effects, 'FloorPenaltyMitigation'), 0)
          : 0;
        const hasWindMitigation = gameMode === 'standard' && windMitigationCount > 0;
       
        const { essence, focus, totalPower } = calculateProjectedPower(
          player.wall,
          completedPatternLines,
          floorPenaltyCount,
          gameMode
        );
        const hasPenalty = floorPenaltyCount > 0;

        const fireRuneCount = gameMode === 'standard'
          ? player.wall.flat().reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'EssenceBonus'), 0) +
            completedPatternLines.reduce((total, line) => total + getPassiveEffectValue(line.effects, 'EssenceBonus'), 0)
          : 0;

        const countRunesOfType = (runeType: RuneType): number => {
          const wallCount = player.wall.flat().reduce((total, cell) => (
            cell.runeType === runeType ? total + 1 : total
          ), 0);

          const pendingCount = completedPatternLines.reduce((total, line) => (
            line.runeType === runeType ? total + 1 : total
          ), 0);

          return wallCount + pendingCount;
        };

        const frostRuneCount = gameMode === 'standard' ? countRunesOfType('Frost') : 0;
        const voidRuneCount = gameMode === 'standard' ? countRunesOfType('Void') : 0;

        return {
          isActive: currentPlayerIndex === 0,
          health: player.health,
          healing: healingAmount,
          essence,
          focus,
          totalPower,
          runePowerTotal,
          fireRuneCount,
          hasPenalty,
          hasWindMitigation,
          windRuneCount: windMitigationCount,
          overloadPenalty: floorPenaltyCount,
          overloadMultiplier,
          overloadDamagePreview,
          round,
          frostRuneCount,
          voidRuneCount,
        };
      })()
    : null;
  
  const handleRuneClick = (runeforgeId: string, runeType: RuneType) => {
    // Direct rune click always drafts that rune type
    draftRune(runeforgeId, runeType);
  };
  
  const handleCenterRuneClick = (runeType: RuneType) => {
    // Direct center rune click drafts that rune type from center
    draftFromCenter(runeType);
  };
  
  const opponent = players[1];
  const playerHiddenPatternSlots = hiddenPatternSlots[players[0].id];
  const opponentHiddenPatternSlots = hiddenPatternSlots[opponent.id];
  const playerHiddenFloorSlots = hiddenFloorSlots[players[0].id];
  const opponentHiddenFloorSlots = hiddenFloorSlots[opponent.id];
  const playerFrozenLines = frozenPatternLines[players[0].id] ?? [];
  const opponentFrozenLines = frozenPatternLines[opponent.id] ?? [];
  const canFreezeOpponentPatternLine = !isSoloMode && frostEffectPending && currentPlayerIndex === 0;
  const canSkipFrostEffect = canFreezeOpponentPatternLine && !isAITurn;

  const handleFreezePatternLine = (lineIndex: number) => {
    if (!canFreezeOpponentPatternLine) {
      return;
    }

    freezePatternLine(opponent.id, lineIndex);
  };

  const handleVoidRuneFromRuneforge = (runeforgeId: string, runeId: string) => {
    if (!voidEffectPending) {
      return;
    }

    destroyRune({ source: 'runeforge', runeforgeId, runeId });
  };

  const handleVoidRuneFromCenter = (runeId: string) => {
    if (!voidEffectPending) {
      return;
    }

    destroyRune({ source: 'center', runeId });
  };
  
  const handleBackgroundClick = () => {
    // Background click handler - no longer needed since PlayerBoard handles it
    // Keeping for potential future use with empty space clicks
  };

  const handleToggleMusic = () => {
    setIsMusicMuted((prev) => !prev);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number.parseFloat(event.currentTarget.value);
    if (!Number.isFinite(nextValue)) {
      return;
    }
    setSoundVolume(nextValue / 100);
  };

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

  const animateRuneforgeToCenter = useCallback((snapshot: RuneforgeAnimationSnapshot) => {
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
  }, [revealCenterRunes]);

  const handleCancelSelection = () => {
    if (isAnimatingPlacement) {
      return;
    }
    cancelSelection();
  };

  const handlePlacementAnimationComplete = () => {
    const nextPlacement = pendingPlacementTarget;
    setAnimatingRunes([]);
    setPendingPlacementTarget(null);
    if (nextPlacement) {
      if (nextPlacement.type === 'pattern') {
        placeRunes(nextPlacement.index);
      } else {
        placeRunesInFloor();
      }
    }
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
  };

  const handleRuneforgeAnimationComplete = useCallback(() => {
    const runeIds = runeforgeAnimationMetaRef.current?.runeIds ?? [];
    runeforgeAnimationMetaRef.current = null;
    setRuneforgeAnimatingRunes([]);
    if (runeIds.length > 0) {
      revealCenterRunes(runeIds);
    }
  }, [revealCenterRunes]);

  const handlePlaceRunesInFloorWrapper = () => {
    if (isAnimatingPlacement) {
      return;
    }
    placeRunesInFloor();
  };

  const handlePatternLinePlacement = (patternLineIndex: number) => {
    if (isAnimatingPlacement) {
      return;
    }
    placeRunes(patternLineIndex);
  };

  // Handle end-of-round trigger
  useEffect(() => {
    if (shouldTriggerEndRound) {
      const timer = setTimeout(() => {
        endRound();
      }, 1000); // 1 second delay for visual effect
      
      return () => clearTimeout(timer);
    }
  }, [shouldTriggerEndRound, endRound]);

  // Handle scoring animation sequence
  useEffect(() => {
    if (!scoringPhase) return;

    let timer: ReturnType<typeof setTimeout>;

    if (scoringPhase === 'moving-to-wall') {
      timer = setTimeout(() => {
        processScoringStep();
      }, 1500);
    } else if (scoringPhase === 'clearing-floor') {
      timer = setTimeout(() => {
        processScoringStep();
      }, 1500);
    } else if (scoringPhase === 'healing') {
      timer = setTimeout(() => {
        processScoringStep();
      }, 1600);
    } else if (scoringPhase === 'damage') {
      timer = setTimeout(() => {
        processScoringStep();
      }, 1600);
    } else if (scoringPhase === 'complete') {
      timer = setTimeout(() => {
        processScoringStep();
      }, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [scoringPhase, processScoringStep]);

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
  }, [selectedRunes.length, triggerAutoPlacementAnimation, players]);

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
  
  const [boardScale, setBoardScale] = useState(() => {
    if (typeof window === 'undefined') {
      return 1;
    }
    return computeBoardScale(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleResize = () => {
      setBoardScale(computeBoardScale(window.innerWidth, window.innerHeight));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const borderColor = 'rgba(255, 255, 255, 0.12)';
  const sectionPadding = 24;
  const scaledBoardSize = BOARD_BASE_SIZE * boardScale;
  
  return (
    <div 
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'radial-gradient(circle at top, #2b184f 0%, #0c041c 65%, #05010d 100%)',
        color: '#f5f3ff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        position: 'relative'
      }}
      onClick={handleBackgroundClick}
    >
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          pointerEvents: 'none',
          zIndex: 12
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            background: 'rgba(12, 10, 24, 0.75)',
            boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#c7d2fe', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                Volume
              </span>
              <span style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 700 }}>
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(soundVolume * 100)}
              onChange={handleVolumeChange}
              aria-label="Sound volume"
              style={{
                width: '100%',
                accentColor: '#7c3aed',
                cursor: 'pointer'
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleToggleMusic}
            aria-pressed={isMusicMuted}
            style={{
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              borderRadius: '999px',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              background: isMusicMuted
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(127, 29, 29, 0.35))'
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(124, 58, 237, 0.35))',
              color: '#e2e8f0',
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
              transition: 'transform 120ms ease, box-shadow 120ms ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'translateY(-1px)';
              event.currentTarget.style.boxShadow = '0 18px 42px rgba(0, 0, 0, 0.6)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'translateY(0)';
              event.currentTarget.style.boxShadow = '0 14px 36px rgba(0, 0, 0, 0.45)';
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: isMusicMuted ? '#f87171' : '#34d399',
                boxShadow: '0 0 12px rgba(255, 255, 255, 0.35)'
              }}
              aria-hidden={true}
            />
            {isMusicMuted ? 'Music Muted' : 'Music On'}
          </button>
        </div>
      </div>

      <div style={{ width: `${scaledBoardSize}px`, height: `${scaledBoardSize}px`, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${BOARD_BASE_SIZE}px`,
            height: `${BOARD_BASE_SIZE}px`,
            transform: `scale(${boardScale})`,
            transformOrigin: 'top left',
            background: 'rgba(9, 3, 24, 0.85)',
            borderRadius: '36px',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 40px 120px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(14px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
        {isSoloMode ? (
          <>
            {/* Solo Top: Player Board */}
            <div style={{ 
              flex: 1, 
              padding: `${sectionPadding}px`,
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayerView
                  player={players[0]}
                  isActive={currentPlayerIndex === 0}
                  onPlaceRunes={currentPlayerIndex === 0 ? handlePatternLinePlacement : undefined}
                  onPlaceRunesInFloor={currentPlayerIndex === 0 ? handlePlaceRunesInFloorWrapper : undefined}
                  selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
                  canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
                  onCancelSelection={handleCancelSelection}
                  gameMode={gameMode}
                  frozenPatternLines={playerFrozenLines}
                  hiddenSlotKeys={playerHiddenPatternSlots}
                  hiddenFloorSlotIndexes={playerHiddenFloorSlots}
                  round={round}
                  hideStatsPanel={true}
                />
              </div>
            </div>

            {/* Solo Middle: Drafting Table */}
            <div style={{ 
              flex: 1, 
              padding: `${sectionPadding}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <RuneforgesAndCenter
                  runeforges={runeforges}
                  centerPool={centerPool}
                  players={players}
                  currentPlayerId={currentPlayer.id}
                  onRuneClick={handleRuneClick}
                  onCenterRuneClick={handleCenterRuneClick}
                  onVoidRuneforgeRuneSelect={handleVoidRuneFromRuneforge}
                  onVoidCenterRuneSelect={handleVoidRuneFromCenter}
                  isDraftPhase={isDraftPhase}
                  hasSelectedRunes={hasSelectedRunes}
                  isAITurn={isAITurn}
                  voidEffectPending={voidEffectPending}
                  frostEffectPending={frostEffectPending}
                  selectedRunes={selectedRunes}
                  draftSource={draftSource}
                  onCancelSelection={handleCancelSelection}
                  onCancelVoidSelection={skipVoidEffect}
                  animatingRuneIds={animatingRuneIds}
                  hiddenCenterRuneIds={hiddenCenterRuneIds}
                  hideOpponentRow={true}
                />
                
                {/* Game Over Modal - Centered over drafting area */}
                {isGameOver && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                    width: 'auto'
                  }}>
                    <SoloGameOverModal
                      player={players[0]}
                      outcome={soloOutcome}
                      runePowerTotal={runePowerTotal}
                      round={round}
                      onReturnToStart={returnToStartScreen}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Solo Bottom: Status and Player Stats */}
            <div style={{ 
              flex: 0.2, 
              padding: `${sectionPadding}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'min(1.4vmin, 16px)' }}>

                {soloStats && <SoloStats {...soloStats} />}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Opponent View - Top */}
            <div style={{ 
              flex: 1, 
              padding: `${sectionPadding}px`,
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <OpponentView
                  opponent={players[1]}
                  isActive={currentPlayerIndex === 1}
                  gameMode={gameMode}
                  frozenPatternLines={opponentFrozenLines}
                  freezeSelectionEnabled={canFreezeOpponentPatternLine}
                  onFreezePatternLine={canFreezeOpponentPatternLine ? handleFreezePatternLine : undefined}
                  onCancelFreezeSelection={canSkipFrostEffect ? skipFrostEffect : undefined}
                  hiddenSlotKeys={opponentHiddenPatternSlots}
                  hiddenFloorSlotIndexes={opponentHiddenFloorSlots}
                  round={round}
                />
              </div>
            </div>

            {/* Drafting Table (Runeforges and Center) - Middle */}
            <div style={{ 
              flex: 1, 
              padding: `${sectionPadding}px`,
              borderBottom: `1px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <RuneforgesAndCenter
                  runeforges={runeforges}
                  centerPool={centerPool}
                  players={players}
                  currentPlayerId={currentPlayer.id}
                  onRuneClick={handleRuneClick}
                  onCenterRuneClick={handleCenterRuneClick}
                  onVoidRuneforgeRuneSelect={handleVoidRuneFromRuneforge}
                  onVoidCenterRuneSelect={handleVoidRuneFromCenter}
                  isDraftPhase={isDraftPhase}
                  hasSelectedRunes={hasSelectedRunes}
                  isAITurn={isAITurn}
                  voidEffectPending={voidEffectPending}
                  frostEffectPending={frostEffectPending}
                  selectedRunes={selectedRunes}
                  draftSource={draftSource}
                  onCancelSelection={handleCancelSelection}
                  onCancelVoidSelection={skipVoidEffect}
                  animatingRuneIds={animatingRuneIds}
                  hiddenCenterRuneIds={hiddenCenterRuneIds}
                  hideOpponentRow={isSoloMode}
                />
                
                {/* Game Over Modal - Centered over drafting area */}
                {isGameOver && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100,
                    width: 'auto'
                  }}>
                    <GameOverModal
                      players={players}
                      winner={winner}
                      onReturnToStart={returnToStartScreen}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Player View - Bottom */}
            <div style={{ 
              flex: 1, 
              padding: `${sectionPadding}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayerView
                  player={players[0]}
                  isActive={currentPlayerIndex === 0}
                  onPlaceRunes={currentPlayerIndex === 0 ? handlePatternLinePlacement : undefined}
                  onPlaceRunesInFloor={currentPlayerIndex === 0 ? handlePlaceRunesInFloorWrapper : undefined}
                  selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
                  canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
                  onCancelSelection={handleCancelSelection}
                  gameMode={gameMode}
                  frozenPatternLines={playerFrozenLines}
                  hiddenSlotKeys={playerHiddenPatternSlots}
                  hiddenFloorSlotIndexes={playerHiddenFloorSlots}
                  round={round}
                />
              </div>
            </div>
          </>
        )}
      </div>
      </div>
      
      {/* Rules Overlay */}
      {showRulesOverlay && (
        <RulesOverlay onClose={() => setShowRulesOverlay(false)} />
      )}
      
      {/* Deck Overlay */}
      {showDeckOverlay && (
        <DeckOverlay
          deck={players[0].deck}
          playerName={players[0].name}
          onClose={() => setShowDeckOverlay(false)}
        />
      )}
      
      {/* Log Overlay */}
      {showLogOverlay && (
        <GameLogOverlay
          roundHistory={gameState.roundHistory}
          onClose={() => setShowLogOverlay(false)}
        />
      )}

      <RuneAnimation
        animatingRunes={animatingRunes}
        onAnimationComplete={handlePlacementAnimationComplete}
      />
      <RuneAnimation
        animatingRunes={runeforgeAnimatingRunes}
        onAnimationComplete={handleRuneforgeAnimationComplete}
      />
    </div>
  );
}
