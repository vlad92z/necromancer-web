/**
 * GameBoardFrame - shared logic and layout shell for solo and duel boards
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { ChangeEvent } from 'react';
import type { GameState, RuneType, AnimatingRune, Rune } from '../../../types/game';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { GameLogOverlay } from './GameLogOverlay';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { VolumeControl } from '../../../components/VolumeControl';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useBackgroundMusic } from '../../../hooks/useBackgroundMusic';
import { useFreezeSound } from '../../../hooks/useFreezeSound';
import { useVoidEffectSound } from '../../../hooks/useVoidEffectSound';
import { useUIStore } from '../../../state/stores/uiStore';
import { getControllerForIndex } from '../../../utils/playerControllers';
import { applyStressMitigation } from '../../../utils/scoring';
import { getPassiveEffectValue } from '../../../utils/runeEffects';
import type { SoloStatsProps } from './Player/SoloStats';

const BOARD_BASE_WIDTH = 1500;
const BOARD_BASE_HEIGHT = 1000;
const BOARD_PADDING = 80;
const MIN_BOARD_SCALE = 0.55;
const MIN_AVAILABLE_SIZE = 520;
const OVERLAY_RUNE_SIZE = 48;

const computeBoardScale = (width: number, height: number): number => {
  const availableWidth = Math.max(width - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const availableHeight = Math.max(height - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const rawScale = Math.min(availableWidth / BOARD_BASE_WIDTH, availableHeight / BOARD_BASE_HEIGHT);
  const clamped = Math.min(rawScale, 1);
  return Math.max(clamped, MIN_BOARD_SCALE);
};

interface SelectionSnapshot {
  playerId: string;
  playerIndex: number;
  runeOrder: Rune[];
  patternLineCounts: number[];
  runePositions: Map<string, { startX: number; startY: number }>;
  floorRuneCount: number;
}

type PendingPlacementTarget = { type: 'pattern'; index: number } | { type: 'floor' } | null;

interface AutoAnimationMeta {
  pattern?: { playerId: string; slotKeys: string[] };
  floor?: { playerId: string; slotIndexes: number[] };
}

interface RuneforgeAnimationSnapshot {
  key: string;
  runes: Rune[];
  runePositions: Map<string, { startX: number; startY: number }>;
}

export type GameBoardVariant = 'solo' | 'duel';

export interface GameBoardProps {
  gameState: GameState;
}

export interface SoloVariantData {
  type: 'solo';
  soloOutcome: GameState['soloOutcome'];
  soloRuneScore: { currentScore: number; targetScore: number } | null;
  soloStats: SoloStatsProps | null;
  soloTargetScore: number;
  runePowerTotal: number;
}

export interface DuelVariantData {
  type: 'duel';
  winner: GameState['players'][number] | null;
}

export type GameBoardVariantData = SoloVariantData | DuelVariantData;

export interface GameBoardSharedProps {
  borderColor: string;
  sectionPadding: number;
  players: GameState['players'];
  currentPlayerIndex: number;
  currentPlayerId: string;
  selectedRuneType: RuneType | null;
  hasSelectedRunes: boolean;
  playerFrozenLines: number[];
  opponentFrozenLines: number[];
  playerLockedLines: number[];
  opponentLockedLines: number[];
  playerHiddenPatternSlots?: Set<string>;
  opponentHiddenPatternSlots?: Set<string>;
  playerHiddenFloorSlots?: Set<number>;
  opponentHiddenFloorSlots?: Set<number>;
  isDraftPhase: boolean;
  isGameOver: boolean;
  isAITurn: boolean;
  runeforges: GameState['runeforges'];
  centerPool: GameState['centerPool'];
  runeTypeCount: GameState['runeTypeCount'];
  voidEffectPending: boolean;
  frostEffectPending: boolean;
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
  animatingRuneIds: string[];
  hiddenCenterRuneIds: Set<string>;
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onCenterRuneClick: (runeType: RuneType, runeId: string) => void;
  onVoidRuneforgeRuneSelect: (runeforgeId: string, runeId: string) => void;
  onVoidCenterRuneSelect: (runeId: string) => void;
  onCancelSelection: () => void;
  onCancelVoidSelection: () => void;
  onPlaceRunes: (patternLineIndex: number) => void;
  onPlaceRunesInFloor: () => void;
  canFreezeOpponentPatternLine: boolean;
  onFreezePatternLine: (lineIndex: number) => void;
  onCancelFreezeSelection?: () => void;
  round: number;
  returnToStartScreen: () => void;
}

export interface GameBoardFrameProps extends GameBoardProps {
  variant: GameBoardVariant;
  renderContent: (shared: GameBoardSharedProps, variantData: GameBoardVariantData) => ReactElement | null;
}

export function GameBoardFrame({ gameState, variant, renderContent }: GameBoardFrameProps) {
  const {
    players,
    runeforges,
    centerPool,
    currentPlayerIndex,
    selectedRunes,
    turnPhase,
    voidEffectPending,
    frostEffectPending,
    frozenPatternLines,
    lockedPatternLines,
    shouldTriggerEndRound,
    scoringPhase,
    draftSource,
    round,
    strain,
  } = gameState;
  const isSoloMode = variant === 'solo';
  const soloOutcome = isSoloMode ? gameState.soloOutcome : null;
  const runePowerTotal = gameState.runePowerTotal;
  const soloTargetScore = gameState.soloTargetScore;
  const { draftRune, draftFromCenter, placeRunes, placeRunesInFloor, cancelSelection, skipVoidEffect, skipFrostEffect } =
    useGameActions();
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
  const activeAnimatingRunes = useMemo(() => [...animatingRunes, ...runeforgeAnimatingRunes], [animatingRunes, runeforgeAnimatingRunes]);
  const isAnimatingPlacement = animatingRunes.length > 0;
  const animatingRuneIds = activeAnimatingRunes.map((rune) => rune.id);
  useRunePlacementSounds(players, activeAnimatingRunes, soundVolume);
  useBackgroundMusic(!isMusicMuted, soundVolume);
  useFreezeSound(frozenPatternLines);
  useVoidEffectSound(voidEffectPending, runeforges, centerPool);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('musicMuted', isMusicMuted ? 'true' : 'false');
  }, [isMusicMuted]);

  const winner = !isSoloMode && isGameOver ? (players[0].health > players[1].health ? players[0] : players[1].health > players[0].health ? players[1] : null) : null;

  const soloRuneScore = isSoloMode
    ? {
        currentScore: runePowerTotal,
        targetScore: soloTargetScore,
      }
    : null;
  const soloStats = isSoloMode
    ? (() => {
        const player = players[0];
        const strainMitigation = player.wall
          .flat()
          .reduce((total, cell) => total + getPassiveEffectValue(cell.effects, 'StrainMitigation'), 0);
        const overloadMultiplier = applyStressMitigation(strain, strainMitigation);

        return {
          isActive: currentPlayerIndex === 0,
          health: player.health,
          overloadMultiplier,
          round,
          deckCount: player.deck.length,
        };
      })()
    : null;

  const handleRuneClick = (runeforgeId: string, runeType: RuneType, runeId: string) => {
    draftRune(runeforgeId, runeType, runeId);
  };

  const handleCenterRuneClick = (runeType: RuneType, runeId: string) => {
    draftFromCenter(runeType, runeId);
  };

  const opponent = players[1];
  const playerHiddenPatternSlots = hiddenPatternSlots[players[0].id];
  const opponentHiddenPatternSlots = hiddenPatternSlots[opponent.id];
  const playerHiddenFloorSlots = hiddenFloorSlots[players[0].id];
  const opponentHiddenFloorSlots = hiddenFloorSlots[opponent.id];
  const playerFrozenLines = frozenPatternLines[players[0].id] ?? [];
  const opponentFrozenLines = frozenPatternLines[opponent.id] ?? [];
  const playerLockedLines = lockedPatternLines[players[0].id] ?? [];
  const opponentLockedLines = lockedPatternLines[opponent.id] ?? [];
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

  useEffect(() => {
    if (shouldTriggerEndRound) {
      const timer = setTimeout(() => {
        endRound();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [shouldTriggerEndRound, endRound]);

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
  const scaledBoardWidth = BOARD_BASE_WIDTH * boardScale;
  const scaledBoardHeight = BOARD_BASE_HEIGHT * boardScale;
  const sharedProps: GameBoardSharedProps = {
    borderColor,
    sectionPadding,
    players,
    currentPlayerIndex,
    currentPlayerId: currentPlayer.id,
    selectedRuneType,
    hasSelectedRunes,
    playerFrozenLines,
    opponentFrozenLines,
    playerLockedLines,
    opponentLockedLines,
    playerHiddenPatternSlots,
    opponentHiddenPatternSlots,
    playerHiddenFloorSlots,
    opponentHiddenFloorSlots,
    isDraftPhase,
    isGameOver,
    isAITurn,
    runeforges,
    centerPool,
    runeTypeCount: gameState.runeTypeCount,
    voidEffectPending,
    frostEffectPending,
    selectedRunes,
    draftSource,
    animatingRuneIds,
    hiddenCenterRuneIds,
    onRuneClick: handleRuneClick,
    onCenterRuneClick: handleCenterRuneClick,
    onVoidRuneforgeRuneSelect: handleVoidRuneFromRuneforge,
    onVoidCenterRuneSelect: handleVoidRuneFromCenter,
    onCancelSelection: handleCancelSelection,
    onCancelVoidSelection: skipVoidEffect,
    onPlaceRunes: handlePatternLinePlacement,
    onPlaceRunesInFloor: handlePlaceRunesInFloorWrapper,
    canFreezeOpponentPatternLine,
    onFreezePatternLine: handleFreezePatternLine,
    onCancelFreezeSelection: canSkipFrostEffect ? skipFrostEffect : undefined,
    round,
    returnToStartScreen,
  };
  const variantData: GameBoardVariantData = isSoloMode
    ? {
        type: 'solo',
        soloOutcome,
        soloRuneScore,
        soloStats,
        soloTargetScore,
        runePowerTotal,
      }
    : {
        type: 'duel',
        winner,
      };
  const boardContent = renderContent(sharedProps, variantData);

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
        position: 'relative',
      }}
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
          zIndex: 12,
        }}
      >
        <VolumeControl soundVolume={soundVolume} onVolumeChange={handleVolumeChange} isMusicMuted={isMusicMuted} onToggleMusic={handleToggleMusic} />
      </div>

      <div style={{ width: `${scaledBoardWidth}px`, height: `${scaledBoardHeight}px`, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${BOARD_BASE_WIDTH}px`,
            height: `${BOARD_BASE_HEIGHT}px`,
            transform: `scale(${boardScale})`,
            transformOrigin: 'top left',
            background: 'rgba(9, 3, 24, 0.85)',
            borderRadius: '36px',
            border: `1px solid ${borderColor}`,
            boxShadow: '0 40px 120px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backdropFilter: 'blur(14px)',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {boardContent}
        </div>
      </div>

      {showRulesOverlay && <RulesOverlay onClose={() => setShowRulesOverlay(false)} />}

      {showDeckOverlay && <DeckOverlay deck={players[0].deck} playerName={players[0].name} onClose={() => setShowDeckOverlay(false)} />}

      {showLogOverlay && <GameLogOverlay roundHistory={gameState.roundHistory} onClose={() => setShowLogOverlay(false)} />}

      <RuneAnimation animatingRunes={animatingRunes} onAnimationComplete={handlePlacementAnimationComplete} />
      <RuneAnimation animatingRunes={runeforgeAnimatingRunes} onAnimationComplete={handleRuneforgeAnimationComplete} />
    </div>
  );
}
