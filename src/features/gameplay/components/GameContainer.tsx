/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { DraftSource, GameState, RuneType, Rune, Runeforge as RuneforgeType } from '../../../types/game';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { OverloadOverlay } from './OverloadOverlay';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { useSelectionStore } from '../../../state/stores/selectionStore';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useUIStore } from '../../../state/stores/uiStore';
import { useRunePlacementAnimations } from '../../../hooks/useRunePlacementAnimations';
import { getArcaneDustReward } from '../../../utils/arcaneDust';
import { useArtefactStore } from '../../../state/stores/artefactStore';
import { useArcaneDustSound } from '../../../hooks/useArcaneDustSound';
import { SoloGameView } from './SoloGameBoard';
import { buildOverloadPlacementTooltipCards, buildPatternLinePlacementTooltipCards, buildRuneTooltipCards } from '../../../utils/tooltipCards';
import { getWallColumnForRune } from '../../../utils/scoring';
import type { ActiveElement, NavigationDirection } from './keyboardNavigation';

const BOARD_BASE_WIDTH = 1500;
const BOARD_BASE_HEIGHT = 1000;
const BOARD_PADDING = 80;
const MIN_BOARD_SCALE = 0.3;
const MIN_AVAILABLE_SIZE = 300;

const computeBoardScale = (width: number, height: number): number => {
  const availableWidth = Math.max(width - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const availableHeight = Math.max(height - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const rawScale = Math.min(availableWidth / BOARD_BASE_WIDTH, availableHeight / BOARD_BASE_HEIGHT);
  const clamped = Math.min(rawScale, 1);
  return Math.max(clamped, MIN_BOARD_SCALE);
};

interface RuneforgeSlotLayout {
  runeforgeId: string;
  disabled: boolean;
  slots: Array<Rune | null>;
}

export interface GameContainerProps {
  gameState: GameState;
}

export interface GameData {
  outcome: GameState['outcome'];
  runeScore: { currentScore: number; targetScore: number };
  playerStats: {
    isActive: boolean;
    overloadMultiplier: number;
    game: number;
    deckCount: number;
    overloadedRuneCount: number;
  };
  targetScore: number;
  runePowerTotal: number;
  arcaneDust: number;
  arcaneDustReward: number;
  totalDeckSize: number;
  deckDraftState: GameState['deckDraftState'];
  isDeckDrafting: boolean;
  onSelectDeckDraftRuneforge: (runeforgeId: string) => void;
  startNextSoloGame: () => void;
}

export interface GameContainerSharedProps {
  // Core context
  player: GameState['player'];
  displayedHealth: number;
  displayedArmor: number;
  game: number;
  strain: number;
  isSelectionPhase: boolean;
  isGameOver: boolean;
  runesPerRuneforge: number;
  runeforgeDraftStage: GameState['runeforgeDraftStage'];

  // Selection state
  selectedRuneType: RuneType | null;
  selectedRunes: Rune[];
  hasSelectedRunes: boolean;
  draftSource: DraftSource | null;

  // Board data
  runeforges: GameState['runeforges'];

  // Locks and visibility
  lockedPatternLines: number[];
  hiddenCenterRuneIds: Set<string>;

  // Actions
  onPlaceRunes: (patternLineIndex: number) => void;
  returnToStartScreen: () => void;
}

export interface GameContainerHandle {
  handleKeyDown: (event: KeyboardEvent) => boolean;
}

export const GameContainer = forwardRef<GameContainerHandle, GameContainerProps>(function GameContainer({ gameState }, ref) {
  const {
    player,
    runeforges,
    runesPerRuneforge,
    runeforgeDraftStage,
    turnPhase,
    lockedPatternLines,
    shouldTriggerEndRound,
    strain,
    soloDeckTemplate,
    overloadRunes,
  } = gameState;
  const selectedRunes = useSelectionStore((state) => state.selectedRunes);
  const draftSource = useSelectionStore((state) => state.draftSource);
  const activeElement = useSelectionStore((state) => state.activeElement);
  const setActiveElement = useSelectionStore((state) => state.setActiveElement);
  const currentGame = useGameplayStore((state) => state.game);
  const outcome = gameState.outcome;
  const runePowerTotal = gameState.runePowerTotal;
  const targetScore = gameState.targetScore;
  const scoringSequence = useGameplayStore((state) => state.scoringSequence);
  const displayedHealth = scoringSequence ? scoringSequence.displayHealth : player.health;
  const displayedArmor = scoringSequence ? scoringSequence.displayArmor : player.armor;
  const displayedRunePowerTotal = scoringSequence ? scoringSequence.displayRunePowerTotal : runePowerTotal;
  const arcaneDustTotal = useArtefactStore((state) => state.arcaneDust);
  const displayedArcaneDust = scoringSequence ? scoringSequence.displayArcaneDust : arcaneDustTotal;
  const {
    draftRune,
    placeRunes,
    moveRunesToWall,
    placeRunesInFloor,
    cancelSelection,
    selectDeckDraftRuneforge,
    disenchantRuneFromDeck,
    startNextSoloGame,
  } = useGameActions();
  const returnToStartScreen = useGameplayStore((state) => state.returnToStartScreen);
  const endRound = useGameplayStore((state) => state.endRound);
  const overloadSoundPending = useGameplayStore((state) => state.overloadSoundPending);
  const acknowledgeOverloadSound = useGameplayStore((state) => state.acknowledgeOverloadSound);
  const channelSoundPending = useGameplayStore((state) => state.channelSoundPending);
  const acknowledgeChannelSound = useGameplayStore((state) => state.acknowledgeChannelSound);
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const soundVolume = useUIStore((state) => state.soundVolume);
  const setSoundVolume = useUIStore((state) => state.setSoundVolume);
  const isMusicMuted = useUIStore((state) => state.isMusicMuted);
  const setMusicMuted = useUIStore((state) => state.setMusicMuted);
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay);
  const setPlayerHiddenPatternSlots = useUIStore((state) => state.setPlayerHiddenPatternSlots);
  const playArcaneDust = useArcaneDustSound();
  const isSelectionPhase = turnPhase === 'select';
  const isDeckDrafting = turnPhase === 'deck-draft';
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = hasSelectedRunes ? selectedRunes[0].runeType : null;
  const patternLineCount = player.patternLines.length;

  const runeforgeSlotAssignmentsRef = useRef<Record<string, Record<string, number>>>({});
  const refocusAfterKeyboardPlacementRef = useRef(false);
  const runeforgeToPatternLineMap = useMemo(() => [0, 1, 3, 4, 5], []);
  const patternLineToRuneforgeMap = useMemo(() => {
    const map = new Map<number, number>();
    runeforgeToPatternLineMap.forEach((lineIndex, runeforgeIndex) => {
      if (typeof lineIndex === 'number') {
        map.set(lineIndex, runeforgeIndex);
      }
    });
    return map;
  }, [runeforgeToPatternLineMap]);
  const firstPatternLineElement = useMemo<ActiveElement | null>(
    () => (patternLineCount > 0 ? { type: 'pattern-line', lineIndex: 0 } : null),
    [patternLineCount],
  );

  const resolvePatternLineForRuneforge = useCallback(
    (runeforgeIndex: number): ActiveElement | null => {
      const lineIndex = runeforgeToPatternLineMap[runeforgeIndex];
      if (typeof lineIndex !== 'number') {
        return null;
      }
      if (!player.patternLines[lineIndex]) {
        return null;
      }
      return { type: 'pattern-line', lineIndex };
    },
    [player.patternLines, runeforgeToPatternLineMap],
  );

  const resolveRuneforgeForPatternLine = useCallback(
    (lineIndex: number): number | null => {
      const mapped = patternLineToRuneforgeMap.get(lineIndex);
      return typeof mapped === 'number' ? mapped : null;
    },
    [patternLineToRuneforgeMap],
  );

  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const showDeckOverlay = useUIStore((state) => state.showDeckOverlay);
  const showOverloadOverlay = useUIStore((state) => state.showOverloadOverlay);
  const fullDeck = useMemo(() => soloDeckTemplate, [soloDeckTemplate]); //TODO: this is bad
  const {
    animatingRunes: placementAnimatingRunes,
    runeforgeAnimatingRunes: centerAnimatingRunes,
    activeAnimatingRunes,
    hiddenPatternSlots,
    hiddenCenterRuneIds,
    isAnimatingPlacement,
    handlePlacementAnimationComplete,
    handleRuneforgeAnimationComplete,
  } = useRunePlacementAnimations({
    player,
    selectedRunes,
    draftSource,
  });

  useRunePlacementSounds(
    activeAnimatingRunes,
    soundVolume,
    overloadSoundPending,
    acknowledgeOverloadSound,
    channelSoundPending,
    acknowledgeChannelSound
  );

  const runeScore = useMemo(
    () => ({
      currentScore: displayedRunePowerTotal,
      targetScore: targetScore,
    }),
    [displayedRunePowerTotal, targetScore],
  );

  const playerStats = useMemo(
    () => ({
      isActive: true,
      overloadMultiplier: strain,
      game: currentGame,
      deckCount: player.deck.length,
      overloadedRuneCount: overloadRunes.length,
    }),
    [currentGame, overloadRunes.length, player.deck.length, strain],
  );

  const prevArcaneDustRef = useRef<number>(displayedArcaneDust);
  useEffect(() => {
    if (displayedArcaneDust > prevArcaneDustRef.current) {
      playArcaneDust();
    }
    prevArcaneDustRef.current = displayedArcaneDust;
  }, [displayedArcaneDust, playArcaneDust]);

  const handleRuneClick = useCallback(
    (runeforgeId: string, runeType: RuneType, runeId: string) => {
      draftRune(runeforgeId, runeType, runeId);
    },
    [draftRune],
  );

  useEffect(() => {
    setPlayerHiddenPatternSlots(hiddenPatternSlots);
  }, [hiddenPatternSlots, setPlayerHiddenPatternSlots]);

  const isPatternLineValidTarget = useCallback(
    (lineIndex: number): boolean => {
      if (!hasSelectedRunes || selectedRuneType === null) {
        return false;
      }

      const line = player.patternLines[lineIndex];
      if (!line || lockedPatternLines.includes(lineIndex)) {
        return false;
      }

      const matchesType = line.runeType === null || line.runeType === selectedRuneType;
      const notFull = line.count < line.tier;
      const wallSize = player.wall.length;
      const col = getWallColumnForRune(lineIndex, selectedRuneType, wallSize);
      const notOnWall = player.wall[lineIndex][col].runeType === null;

      return matchesType && notFull && notOnWall;
    },
    [hasSelectedRunes, player.patternLines, lockedPatternLines, player.wall, selectedRuneType],
  );

  const buildPlacementTargets = useCallback((): ActiveElement[] => {
    if (!hasSelectedRunes) {
      return [];
    }

    const targets: ActiveElement[] = [{ type: 'overload' }];

    player.patternLines.forEach((_, lineIndex) => {
      if (isPatternLineValidTarget(lineIndex)) {
        targets.push({ type: 'pattern-line', lineIndex });
      }
    });

    return targets;
  }, [hasSelectedRunes, isPatternLineValidTarget, player.patternLines]);

  const pickDefaultPlacementTarget = useCallback((): ActiveElement | null => {
    const targets = buildPlacementTargets();
    if (targets.length === 0) {
      return null;
    }

    const firstPlaceableLine = targets.find((target) => target.type === 'pattern-line');
    return firstPlaceableLine ?? targets[0];
  }, [buildPlacementTargets]);

  const handleToggleMusic = useCallback(() => {
    setMusicMuted(!isMusicMuted);
  }, [isMusicMuted, setMusicMuted]);

  const handleVolumeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number.parseFloat(event.currentTarget.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      setSoundVolume(nextValue / 100);
    },
    [setSoundVolume],
  );

  const handleCancelSelection = useCallback(() => {
    if (isAnimatingPlacement) {
      return;
    }
    cancelSelection();
  }, [cancelSelection, isAnimatingPlacement]);

  const handlePlaceRunesInFloorWrapper = useCallback(() => {
    if (isAnimatingPlacement) {
      return;
    }
    placeRunesInFloor();
  }, [isAnimatingPlacement, placeRunesInFloor]);

  const handlePatternLinePlacement = useCallback(
    (patternLineIndex: number) => {
      if (isAnimatingPlacement) {
        return;
      }
      placeRunes(patternLineIndex);
    },
    [isAnimatingPlacement, placeRunes],
  );

  const handleOverloadAction = useCallback(() => {
    if (hasSelectedRunes) {
      handlePlaceRunesInFloorWrapper();
    } else {
      useUIStore.getState().toggleOverloadOverlay();
    }
  }, [handlePlaceRunesInFloorWrapper, hasSelectedRunes]);

  useEffect(() => {
    if (shouldTriggerEndRound) {
      const timer = setTimeout(() => {
        endRound();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [shouldTriggerEndRound, endRound]);

  useEffect(() => {
    if (turnPhase !== 'cast') return;

    const timer = setTimeout(() => {
      moveRunesToWall();
    }, 750);

    return () => clearTimeout(timer);
  }, [turnPhase, moveRunesToWall]);

  const computeRuneforgeSlots = useCallback(
    (runeforge: RuneforgeType): Array<Rune | null> => {
      const totalSlots = Math.max(runesPerRuneforge, runeforge.runes.length, 1);
      const existingAssignments = runeforgeSlotAssignmentsRef.current[runeforge.id] ?? {};
      const nextAssignments: Record<string, number> = {};
      const usedSlots = new Set<number>();

      runeforge.runes.forEach((rune) => {
        const existingSlot = existingAssignments[rune.id];
        if (typeof existingSlot === 'number' && existingSlot >= 0 && existingSlot < totalSlots) {
          nextAssignments[rune.id] = existingSlot;
          usedSlots.add(existingSlot);
        }
      });

      let cursor = 0;
      runeforge.runes.forEach((rune) => {
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

      runeforgeSlotAssignmentsRef.current[runeforge.id] = nextAssignments;

      const runeBySlot = new Map<number, Rune>();
      runeforge.runes.forEach((rune) => {
        const slotIndex = nextAssignments[rune.id];
        if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < totalSlots) {
          runeBySlot.set(slotIndex, rune);
        }
      });

      return Array.from({ length: totalSlots }, (_, index) => runeBySlot.get(index) ?? null);
    },
    [runesPerRuneforge],
  );

  useEffect(() => {
    const activeRuneforgeIds = new Set(runeforges.map((forge) => forge.id));
    const assignments = runeforgeSlotAssignmentsRef.current;
    Object.keys(assignments).forEach((runeforgeId) => {
      if (!activeRuneforgeIds.has(runeforgeId)) {
        delete assignments[runeforgeId];
      }
    });
  }, [runeforges]);

  const runeforgeSlotLayouts = useMemo<RuneforgeSlotLayout[]>(
    () => runeforges.map((runeforge) => ({
      runeforgeId: runeforge.id,
      disabled: runeforge.disabled ?? false,
      slots: computeRuneforgeSlots(runeforge),
    })),
    [computeRuneforgeSlots, runeforges],
  );

  interface RunePosition {
    runeforgeIndex: number;
    runeIndex: number;
    runeId: string;
  }

  const availableRunePositions = useMemo<RunePosition[]>(
    () => runeforgeSlotLayouts.flatMap((layout, runeforgeIndex) => {
      if (layout.disabled) {
        return [];
      }
      return layout.slots
        .map((slotRune, runeIndex) => (slotRune ? { runeforgeIndex, runeIndex, runeId: slotRune.id } : null))
        .filter((position): position is RunePosition => position !== null);
    }),
    [runeforgeSlotLayouts],
  );

  const pickFirstAvailableRune = useCallback((): ActiveElement | null => {
    for (let rowIndex = 0; rowIndex < runeforgeSlotLayouts.length; rowIndex += 1) {
      const layout = runeforgeSlotLayouts[rowIndex];
      if (layout.disabled) {
        continue;
      }
      const firstRuneIndex = layout.slots.findIndex((slot) => slot !== null);
      if (firstRuneIndex !== -1) {
        return { type: 'runeforge-rune', runeforgeIndex: rowIndex, runeIndex: firstRuneIndex };
      }
    }
    return null;
  }, [runeforgeSlotLayouts]);

  useEffect(() => {
    if (!refocusAfterKeyboardPlacementRef.current) {
      return;
    }
    if (hasSelectedRunes) {
      return;
    }
    const nextRune = pickFirstAvailableRune();
    setActiveElement(nextRune);
    refocusAfterKeyboardPlacementRef.current = false;
  }, [hasSelectedRunes, pickFirstAvailableRune]);

  const chooseBestCandidate = useCallback(
    (
      candidates: RunePosition[],
      score: (candidate: RunePosition) => [number, number],
    ): RunePosition | null => {
      let best: RunePosition | null = null;
      let bestScore: [number, number] | null = null;

      candidates.forEach((candidate) => {
        const candidateScore = score(candidate);
        if (!bestScore || candidateScore[0] < bestScore[0] || (candidateScore[0] === bestScore[0] && candidateScore[1] < bestScore[1])) {
          best = candidate;
          bestScore = candidateScore;
        }
      });

      return best;
    },
    [],
  );

  const pickFirstRuneInRuneforge = useCallback(
    (runeforgeIndex: number): ActiveElement | null => {
      const candidates = availableRunePositions.filter((position) => position.runeforgeIndex === runeforgeIndex);
      if (candidates.length === 0) {
        return null;
      }
      const best = chooseBestCandidate(candidates, (candidate) => [candidate.runeIndex, 0]);
      return best ? { type: 'runeforge-rune', runeforgeIndex: best.runeforgeIndex, runeIndex: best.runeIndex } : null;
    },
    [availableRunePositions, chooseBestCandidate],
  );

  const navigateFromSettingsbutton = useCallback(
    (direction: NavigationDirection, current: ActiveElement): ActiveElement | null => {
      if (direction === 'right') {
        return { type: 'overload' };
      }
      if (direction === 'down') {
        const fallback = pickFirstAvailableRune();
        return fallback ?? current;
      }
      return current;
    },
    [pickFirstAvailableRune],
  );

  const navigateFromOverloadButton = useCallback(
    (direction: NavigationDirection, current: ActiveElement): ActiveElement | null => {
      if (direction === 'right') {
        return { type: 'deck' };
      }
      if (direction === 'left') {
        return { type: 'settings' };
      }
      if (direction === 'down') {
        if (firstPatternLineElement) {
          return firstPatternLineElement;
        }
        const fallback = pickFirstAvailableRune();
        return fallback ?? current;
      }
      return current;
    },
    [firstPatternLineElement, pickFirstAvailableRune],
  );

  const navigateFromDeckButton = useCallback(
    (direction: NavigationDirection, current: ActiveElement): ActiveElement | null => {
      if (direction === 'left') {
        return { type: 'overload' };
      }
      if (direction === 'down') {
        if (firstPatternLineElement) {
          return firstPatternLineElement;
        }
        const fallback = pickFirstAvailableRune();
        return fallback ?? current;
      }
      return current;
    },
    [firstPatternLineElement, pickFirstAvailableRune],
  );

  const navigateFromPatternLine = useCallback(
    (direction: NavigationDirection, current: { type: 'pattern-line'; lineIndex: number }): ActiveElement | null => {
      if (direction === 'up') {
        if (current.lineIndex === 0) {
          return { type: 'overload' };
        }
        return { type: 'pattern-line', lineIndex: Math.max(0, current.lineIndex - 1) };
      }
      if (direction === 'down') {
        const lastIndex = patternLineCount - 1;
        if (lastIndex < 0) {
          return current;
        }
        return { type: 'pattern-line', lineIndex: Math.min(lastIndex, current.lineIndex + 1) };
      }

      if (direction === 'left' && selectedRunes.length === 0) {
        const mappedRuneforgeIndex = resolveRuneforgeForPatternLine(current.lineIndex);
        if (mappedRuneforgeIndex !== null) {
          const mappedRune = pickFirstRuneInRuneforge(mappedRuneforgeIndex);
          if (mappedRune) {
            return mappedRune;
          }
        }
        const fallback = pickFirstAvailableRune();
        return fallback ?? current;
      }
      return current;
    },
    [patternLineCount, pickFirstAvailableRune, pickFirstRuneInRuneforge, resolveRuneforgeForPatternLine, selectedRunes.length],
  );

  const selectClosestRuneFromRuneforge = useCallback(
    (direction: NavigationDirection, current: { type: 'runeforge-rune'; runeforgeIndex: number; runeIndex: number }): ActiveElement | null => {
      const currentRune = availableRunePositions.find(
        (position) => position.runeforgeIndex === current.runeforgeIndex && position.runeIndex === current.runeIndex,
      );

      if (!currentRune) {
        return pickFirstAvailableRune();
      }
      const sameRowCandidates = availableRunePositions.filter((position) => position.runeforgeIndex === currentRune.runeforgeIndex);
      switch (direction) {
        case 'left': {
          const leftCandidates = sameRowCandidates.filter((position) => position.runeIndex < currentRune.runeIndex);
          const bestLeft = chooseBestCandidate(leftCandidates, (candidate) => [currentRune.runeIndex - candidate.runeIndex, 0]);
          if (bestLeft) {
            return { type: 'runeforge-rune', runeforgeIndex: bestLeft.runeforgeIndex, runeIndex: bestLeft.runeIndex };
          }

          const anyLeft = availableRunePositions.filter((position) => position.runeIndex < currentRune.runeIndex);
          const bestAnyLeft = chooseBestCandidate(
            anyLeft,
            (candidate) => [currentRune.runeIndex - candidate.runeIndex, Math.abs(candidate.runeforgeIndex - currentRune.runeforgeIndex)],
          );
          return bestAnyLeft
            ? { type: 'runeforge-rune', runeforgeIndex: bestAnyLeft.runeforgeIndex, runeIndex: bestAnyLeft.runeIndex }
            : current;
        }
        case 'right': {
          const rightCandidates = sameRowCandidates.filter((position) => position.runeIndex > currentRune.runeIndex);
          const bestRight = chooseBestCandidate(rightCandidates, (candidate) => [candidate.runeIndex - currentRune.runeIndex, 0]);
          if (bestRight) {
            return { type: 'runeforge-rune', runeforgeIndex: bestRight.runeforgeIndex, runeIndex: bestRight.runeIndex };
          }

          const anyRight = availableRunePositions.filter((position) => position.runeIndex > currentRune.runeIndex);
          const bestAnyRight = chooseBestCandidate(
            anyRight,
            (candidate) => [candidate.runeIndex - currentRune.runeIndex, Math.abs(candidate.runeforgeIndex - currentRune.runeforgeIndex)],
          );
          if (bestAnyRight) {
            return { type: 'runeforge-rune', runeforgeIndex: bestAnyRight.runeforgeIndex, runeIndex: bestAnyRight.runeIndex };
          }

          const mappedPatternLine = resolvePatternLineForRuneforge(currentRune.runeforgeIndex);
          return mappedPatternLine ?? current;
        }
        case 'up': {
          const above = availableRunePositions.filter((position) => position.runeforgeIndex < currentRune.runeforgeIndex);
          const bestAbove = chooseBestCandidate(
            above,
            (candidate) => [currentRune.runeforgeIndex - candidate.runeforgeIndex, Math.abs(candidate.runeIndex - currentRune.runeIndex)],
          );
          if (bestAbove) {
            return { type: 'runeforge-rune', runeforgeIndex: bestAbove.runeforgeIndex, runeIndex: bestAbove.runeIndex };
          }

          return { type: 'settings' };
        }
        case 'down': {
          const below = availableRunePositions.filter((position) => position.runeforgeIndex > currentRune.runeforgeIndex);
          const bestBelow = chooseBestCandidate(
            below,
            (candidate) => [candidate.runeforgeIndex - currentRune.runeforgeIndex, Math.abs(candidate.runeIndex - currentRune.runeIndex)],
          );
          return bestBelow
            ? { type: 'runeforge-rune', runeforgeIndex: bestBelow.runeforgeIndex, runeIndex: bestBelow.runeIndex }
            : current;
        }
        default:
          return current;
      }
    },
    [availableRunePositions, chooseBestCandidate, pickFirstAvailableRune, resolvePatternLineForRuneforge],
  );

  const resolveNextElement = useCallback(
    (direction: NavigationDirection, current: ActiveElement | null): ActiveElement | null => {
      if (current?.type === 'settings') {
        return navigateFromSettingsbutton(direction, current);
      }

      if (current?.type === 'overload') {
        return navigateFromOverloadButton(direction, current);
      }

      if (current?.type === 'deck') {
        return navigateFromDeckButton(direction, current);
      }

      if (current?.type === 'pattern-line') {
        return navigateFromPatternLine(direction, current);
      }

      if (availableRunePositions.length === 0) {
        return current;
      }

      if (!current || current.type !== 'runeforge-rune') {
        return pickFirstAvailableRune();
      }

      return selectClosestRuneFromRuneforge(direction, current);
    },
    [
      availableRunePositions,
      navigateFromDeckButton,
      navigateFromOverloadButton,
      navigateFromPatternLine,
      navigateFromSettingsbutton,
      pickFirstAvailableRune,
      selectClosestRuneFromRuneforge,
    ],
  );

  const resolvePlacementNavigation = useCallback(
    (direction: Extract<NavigationDirection, 'up' | 'down'>, current: ActiveElement | null): ActiveElement | null => {
      const targets = buildPlacementTargets();
      if (targets.length === 0) {
        return null;
      }

      const findIndex = (element: ActiveElement | null): number => {
        if (!element) {
          return -1;
        }

        return targets.findIndex((target) => {
          if (target.type !== element.type) {
            return false;
          }

          if (target.type === 'pattern-line' && element.type === 'pattern-line') {
            return target.lineIndex === element.lineIndex;
          }

          return true;
        });
      };

      const currentIndex = findIndex(current);
      const firstPlaceableLine = targets.find((target) => target.type === 'pattern-line') ?? targets[0];

      if (currentIndex === -1) {
        return firstPlaceableLine;
      }

      if (direction === 'up') {
        const nextIndex = Math.max(0, currentIndex - 1);
        return targets[nextIndex];
      }

      const nextIndex = Math.min(targets.length - 1, currentIndex + 1);
      return targets[nextIndex];
    },
    [buildPlacementTargets],
  );

  const handleNavigation = useCallback(
    (direction: NavigationDirection) => {
      if (hasSelectedRunes) {
        if (direction === 'left' || direction === 'right') {
          return;
        }

        if (direction !== 'up' && direction !== 'down') {
          return;
        }

        setActiveElement((current) => {
          const next = resolvePlacementNavigation(direction, current);
          if (next) {
            return next;
          }

          if (current?.type === 'pattern-line' && isPatternLineValidTarget(current.lineIndex)) {
            return current;
          }

          if (current?.type === 'overload') {
            return current;
          }

          return pickDefaultPlacementTarget() ?? current ?? null;
        });
        return;
      }

      setActiveElement((current) => {
        const next = resolveNextElement(direction, current);
        if (!next) {
          return current ?? null;
        }

        if (
          current?.type === 'runeforge-rune'
          && next.type === 'runeforge-rune'
          && current.runeforgeIndex === next.runeforgeIndex
          && current.runeIndex === next.runeIndex
        ) {
          return current;
        }

        return next;
      });
    },
    [hasSelectedRunes, isPatternLineValidTarget, pickDefaultPlacementTarget, resolveNextElement, resolvePlacementNavigation],
  );

  const computeSelectionRunesForTooltip = useCallback(
    (runeforgeId: string, runeType: RuneType): Rune[] => {
      if (runeforgeDraftStage === 'global') {
        return runeforges
          .filter((forge) => !(forge.disabled ?? false))
          .flatMap((forge) => forge.runes.filter((rune) => rune.runeType === runeType));
      }

      const runeforge = runeforges.find((forge) => forge.id === runeforgeId);
      if (!runeforge || runeforge.disabled) {
        return [];
      }

      return runeforge.runes.filter((rune) => rune.runeType === runeType);
    },
    [runeforgeDraftStage, runeforges],
  );

  useEffect(() => {
    if (!activeElement) {
      return undefined;
    }

    const handleMouseMove = () => {
      setActiveElement(null);
      resetTooltipCards();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [activeElement, resetTooltipCards]);

  useEffect(() => {
    if (activeElement?.type !== 'runeforge-rune') {
      return;
    }

    const layout = runeforgeSlotLayouts[activeElement.runeforgeIndex];
    if (!layout || layout.disabled) {
      const fallback = pickFirstAvailableRune();
      setActiveElement(fallback);
      return;
    }

    const runeAtSlot = layout.slots[activeElement.runeIndex];
    if (!runeAtSlot) {
      const fallback = pickFirstAvailableRune();
      setActiveElement(fallback);
    }
  }, [activeElement, pickFirstAvailableRune, runeforgeSlotLayouts]);

  const allowKeyboardNavigation = useMemo(
    () => (
      !showSettingsOverlay
      && !showOverloadOverlay
      && !showRulesOverlay
      && !isDeckDrafting
      && !isGameOver
    ),
    [isDeckDrafting, isGameOver, showOverloadOverlay, showRulesOverlay, showSettingsOverlay],
  );

  useEffect(() => {
    if (!allowKeyboardNavigation && activeElement !== null) {
      setActiveElement(null);
    }
  }, [activeElement, allowKeyboardNavigation]);

  useEffect(() => {
    if (!allowKeyboardNavigation || !hasSelectedRunes) {
      return;
    }

    const defaultPlacementTarget = pickDefaultPlacementTarget();
    if (!defaultPlacementTarget) {
      return;
    }

    setActiveElement((current) => {
      if (current?.type === 'pattern-line' && isPatternLineValidTarget(current.lineIndex)) {
        return current;
      }

      if (current?.type === 'overload') {
        return current;
      }

      return defaultPlacementTarget;
    });
  }, [allowKeyboardNavigation, hasSelectedRunes, isPatternLineValidTarget, pickDefaultPlacementTarget]);

  useEffect(() => {
    if (!allowKeyboardNavigation) {
      resetTooltipCards();
      return;
    }

    if (activeElement?.type === 'runeforge-rune') {
      const layout = runeforgeSlotLayouts[activeElement.runeforgeIndex];
      if (layout && !layout.disabled) {
        const runeAtSlot = layout.slots[activeElement.runeIndex];
        if (runeAtSlot) {
          const selectionRunes = computeSelectionRunesForTooltip(layout.runeforgeId, runeAtSlot.runeType);
          if (selectionRunes.length > 0) {
            setTooltipCards(buildRuneTooltipCards(selectionRunes, runeAtSlot.id));
            return;
          }
        }
      }
    }

    if (activeElement?.type === 'pattern-line' && hasSelectedRunes) {
      const line = player.patternLines[activeElement.lineIndex];
      const isPlacementTarget = isPatternLineValidTarget(activeElement.lineIndex);
      if (line && isPlacementTarget) {
        const tooltipCards = buildPatternLinePlacementTooltipCards({
          selectedRunes,
          patternLineTier: line.tier,
          patternLineCount: line.count,
          strain,
        });
        if (tooltipCards.length > 0) {
          setTooltipCards(tooltipCards, true);
          return;
        }
      }
    }

    if (activeElement?.type === 'overload' && hasSelectedRunes) {
      const tooltipCards = buildOverloadPlacementTooltipCards(selectedRunes, strain);
      if (tooltipCards.length > 0) {
        setTooltipCards(tooltipCards, true);
        return;
      }
    }

    resetTooltipCards();
  }, [
    activeElement,
    allowKeyboardNavigation,
    computeSelectionRunesForTooltip,
    hasSelectedRunes,
    isPatternLineValidTarget,
    player.patternLines,
    resetTooltipCards,
    runeforgeSlotLayouts,
    selectedRunes,
    setTooltipCards,
    strain,
  ]);

  const selectActiveRune = useCallback(() => {
    if (hasSelectedRunes) {
      return;
    }

    if (activeElement?.type !== 'runeforge-rune') {
      return;
    }

    const layout = runeforgeSlotLayouts[activeElement.runeforgeIndex];
    if (!layout || layout.disabled) {
      return;
    }

    const runeAtSlot = layout.slots[activeElement.runeIndex];
    if (!runeAtSlot) {
      return;
    }

    handleRuneClick(layout.runeforgeId, runeAtSlot.runeType, runeAtSlot.id);
  }, [activeElement, handleRuneClick, hasSelectedRunes, runeforgeSlotLayouts]);

  const handleActiveElementAction = useCallback((): boolean => {
    if (!activeElement) {
      return false;
    }

    if (activeElement.type === 'settings') {
      useUIStore.getState().toggleSettingsOverlay();
      return true;
    }

    if (activeElement.type === 'overload') {
      handleOverloadAction();
      return true;
    }

    if (activeElement.type === 'runeforge-rune') {
      selectActiveRune();
      return true;
    }

    if (activeElement.type === 'pattern-line') {
      if (!isPatternLineValidTarget(activeElement.lineIndex) || isAnimatingPlacement) {
        return false;
      }
      refocusAfterKeyboardPlacementRef.current = true;
      handlePatternLinePlacement(activeElement.lineIndex);
      return true;
    }

    return false;
  }, [
    activeElement,
    // handleOpenDeckOverlay,
    handleOverloadAction,
    handlePatternLinePlacement,
    isAnimatingPlacement,
    isPatternLineValidTarget,
    selectActiveRune
    ]);

  useImperativeHandle(ref, () => ({
    handleKeyDown: (event: KeyboardEvent) => {
      console.log('GameContainer received keydown:', event.key, allowKeyboardNavigation);
      if (showSettingsOverlay) {
        return false;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        if (hasSelectedRunes) {
          handleCancelSelection();
          return true;
        }

        console.log('Toggling settings overlay via Escape key');
        useUIStore.getState().toggleSettingsOverlay();
        return true;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (!allowKeyboardNavigation) {
            return false;
          }
          event.preventDefault();
          handleNavigation('left');
          return true;
        case 'ArrowRight':
          if (!allowKeyboardNavigation) {
            return false;
          }
          event.preventDefault();
          handleNavigation('right');
          return true;
        case 'ArrowUp':
          if (!allowKeyboardNavigation) {
            return false;
          }
          event.preventDefault();
          handleNavigation('up');
          return true;
        case 'ArrowDown':
          if (!allowKeyboardNavigation) {
            return false;
          }
          event.preventDefault();
          handleNavigation('down');
          return true;
        case 'Enter':
        case ' ': // Space
        case 'Spacebar': {
          if (!allowKeyboardNavigation) {
            return false;
          }
          event.preventDefault();
          return handleActiveElementAction();
        }
        default:
          return false;
      }
    },
  }));


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

  const scaledBoardWidth = BOARD_BASE_WIDTH * boardScale;
  const scaledBoardHeight = BOARD_BASE_HEIGHT * boardScale;
  const sharedProps: GameContainerSharedProps = useMemo(
    () => ({
      player,
      displayedHealth,
      displayedArmor,
      currentPlayerIndex: 0,
      game: currentGame,
      strain,
      isSelectionPhase: isSelectionPhase,
      isGameOver,
      runesPerRuneforge,
      runeforgeDraftStage,
      selectedRuneType,
      selectedRunes,
      hasSelectedRunes,
      draftSource,
      runeforges,
      lockedPatternLines,
      hiddenCenterRuneIds,
      onPlaceRunes: handlePatternLinePlacement,
      returnToStartScreen,
    }),
    [
      displayedArmor,
      displayedHealth,
      currentGame,
      draftSource,
      handlePatternLinePlacement,
      hasSelectedRunes,
      hiddenCenterRuneIds,
      isSelectionPhase,
      isGameOver,
      player,
      runesPerRuneforge,
      lockedPatternLines,
      strain,
      returnToStartScreen,
      runeforges,
      selectedRuneType,
      runeforgeDraftStage,
      selectedRunes,
    ],
  );

  const gameData: GameData = useMemo(
    () => ({
      outcome,
      runeScore,
      playerStats,
      targetScore,
      runePowerTotal: displayedRunePowerTotal,
      arcaneDust: displayedArcaneDust,
      arcaneDustReward: getArcaneDustReward(currentGame),
      totalDeckSize: fullDeck.length,
      deckDraftState: gameState.deckDraftState,
      isDeckDrafting,
      onSelectDeckDraftRuneforge: selectDeckDraftRuneforge,
      startNextSoloGame: startNextSoloGame,
    }),
    [
      displayedArcaneDust,
      currentGame,
      gameState.deckDraftState,
      fullDeck.length,
      isDeckDrafting,
      displayedRunePowerTotal,
      selectDeckDraftRuneforge,
      outcome,
      runeScore,
      playerStats,
      targetScore,
      startNextSoloGame,
    ],
  );

  return (
    <div
      className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#2b184f_0%,_#0c041c_65%,_#05010d_100%)] text-[#f5f3ff] flex items-center justify-center box-border relative"
    >
      <div className="relative" style={{ width: `${scaledBoardWidth}px`, height: `${scaledBoardHeight}px` }}>
        <div
          className="absolute top-0 left-0 origin-top-left bg-[rgba(9,3,24,0.85)] rounded-[36px] border border-white/12 shadow-[0_40px_120px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden backdrop-blur-[14px]"
          style={{
            width: `${BOARD_BASE_WIDTH}px`,
            height: `${BOARD_BASE_HEIGHT}px`,
            transform: `scale(${boardScale})`,
            transformOrigin: 'top left',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <SoloGameView shared={sharedProps} gameData={gameData} />
        </div>
      </div>

      {showRulesOverlay && <RulesOverlay onClose={() => setShowRulesOverlay(false)} />}

      {showDeckOverlay && (
        <DeckOverlay
          deck={player.deck}
          fullDeck={fullDeck}
          playerName={player.name}
          isDeckDrafting={isDeckDrafting}
          onDisenchantRune={disenchantRuneFromDeck}
        />
      )}

      {showOverloadOverlay && (
        <OverloadOverlay />
      )}
      {showSettingsOverlay && (
        <SettingsOverlay
          soundVolume={soundVolume}
          isMusicMuted={isMusicMuted}
          onVolumeChange={handleVolumeChange}
          onToggleMusic={handleToggleMusic}
          onQuitRun={returnToStartScreen}
          showQuitRun={true}
        />
      )
      }
      <RuneAnimation animatingRunes={placementAnimatingRunes} onAnimationComplete={handlePlacementAnimationComplete} />
      <RuneAnimation animatingRunes={centerAnimatingRunes} onAnimationComplete={handleRuneforgeAnimationComplete} />
    </div>
  );
});
