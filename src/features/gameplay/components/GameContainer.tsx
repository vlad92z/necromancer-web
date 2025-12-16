/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { GameState, RuneType, Rune, Runeforge as RuneforgeType } from '../../../types/game';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { OverloadOverlay } from './OverloadOverlay';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useClickSound } from '../../../hooks/useClickSound';
import { useUIStore } from '../../../state/stores/uiStore';
import { useRunePlacementAnimations } from '../../../hooks/useRunePlacementAnimations';
import { getArcaneDustReward } from '../../../utils/arcaneDust';
import { useArtefactStore } from '../../../state/stores/artefactStore';
import { useArcaneDustSound } from '../../../hooks/useArcaneDustSound';
import { SoloGameView } from './SoloGameBoard';
import { buildRuneTooltipCards } from '../../../utils/tooltipCards';
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
  onOpenDeckOverlay: () => void;
  onOpenOverloadOverlay: () => void;
  onOpenSettings: () => void;
  startNextSoloGame: () => void;
}

export interface GameContainerSharedProps {
  // Core context
  player: GameState['player'];
  displayedHealth: number;
  displayedArmor: number;
  currentPlayerIndex: number;
  currentPlayerId: string;
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
  draftSource: GameState['draftSource'];
  activeElement: ActiveElement | null;

  // Board data
  runeforges: GameState['runeforges'];
  centerPool: GameState['centerPool'];

  // Locks and visibility
  playerLockedLines: number[];
  playerHiddenPatternSlots?: Set<string>;
  animatingRuneIds: string[];
  hiddenCenterRuneIds: Set<string>;

  // Actions
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onCenterRuneClick: (runeType: RuneType, runeId: string) => void;
  onCancelSelection: () => void;
  onPlaceRunes: (patternLineIndex: number) => void;
  onPlaceRunesInFloor: () => void;
  returnToStartScreen: () => void;
}

export function GameContainer({ gameState }: GameContainerProps) {
  const {
    player,
    runeforges,
    centerPool,
    runesPerRuneforge,
    runeforgeDraftStage,
    selectedRunes,
    turnPhase,
    lockedPatternLines,
    shouldTriggerEndRound,
    draftSource,
    strain,
    soloDeckTemplate,
    overloadRunes,
  } = gameState;
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
    draftFromCenter,
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
  const toggleSettingsOverlay = useUIStore((state) => state.toggleSettingsOverlay);
  const playArcaneDust = useArcaneDustSound();
  const playClickSound = useClickSound();

  const runeforgeSlotAssignmentsRef = useRef<Record<string, Record<string, number>>>({});
  const [activeElement, setActiveElement] = useState<ActiveElement | null>(null);

  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [showDeckOverlay, setShowDeckOverlay] = useState(false);
  const [showOverloadOverlay, setShowOverloadOverlay] = useState(false);
  const isSelectionPhase = turnPhase === 'select';
  const isDeckDrafting = turnPhase === 'deck-draft';
  const isGameOver = turnPhase === 'game-over';
  const hasSelectedRunes = selectedRunes.length > 0;
  const selectedRuneType = selectedRunes.length > 0 ? selectedRunes[0].runeType : null;
  const fullDeck = useMemo(() => soloDeckTemplate, [soloDeckTemplate]);
  const {
    animatingRunes: placementAnimatingRunes,
    runeforgeAnimatingRunes: centerAnimatingRunes,
    activeAnimatingRunes,
    animatingRuneIds,
    hiddenPatternSlots,
    hiddenCenterRuneIds,
    isAnimatingPlacement,
    handlePlacementAnimationComplete,
    handleRuneforgeAnimationComplete,
  } = useRunePlacementAnimations({
    player,
    selectedRunes,
    draftSource,
    centerPool,
  });
  
  useRunePlacementSounds(
    [player],
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

  const handleCenterRuneClick = useCallback(
    (runeType: RuneType, runeId: string) => {
      draftFromCenter(runeType, runeId);
    },
    [draftFromCenter],
  );

  const playerHiddenPatternSlots = useMemo(
    () => hiddenPatternSlots[player.id],
    [hiddenPatternSlots, player.id],
  );
  const playerLockedLines = useMemo(() => lockedPatternLines[player.id], [lockedPatternLines, player.id]);

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

  const handleOpenDeckOverlay = useCallback(() => setShowDeckOverlay(true), []);
  const handleCloseDeckOverlay = useCallback(() => setShowDeckOverlay(false), []);
  const handleOpenOverloadOverlay = useCallback(() => setShowOverloadOverlay(true), []);
  const handleCloseOverloadOverlay = useCallback(() => setShowOverloadOverlay(false), []);

  const handleOpenSettings = useCallback(() => {
    toggleSettingsOverlay();
  }, [toggleSettingsOverlay]);

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

  const chooseBestCandidate = (
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
  };

  const resolveNextElement = useCallback(
    (direction: NavigationDirection, current: ActiveElement | null): ActiveElement | null => {
      if (availableRunePositions.length === 0) {
        return null;
      }

      if (!current || current.type !== 'runeforge-rune') {
        return pickFirstAvailableRune();
      }

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
          return bestAnyRight
            ? { type: 'runeforge-rune', runeforgeIndex: bestAnyRight.runeforgeIndex, runeIndex: bestAnyRight.runeIndex }
            : current;
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
    [availableRunePositions, pickFirstAvailableRune],
  );

  const handleNavigation = useCallback(
    (direction: NavigationDirection) => {
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
    [resolveNextElement],
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
      isSelectionPhase
      && !hasSelectedRunes
      && !showSettingsOverlay
      && !showDeckOverlay
      && !showOverloadOverlay
      && !showRulesOverlay
      && !isDeckDrafting
      && !isGameOver
    ),
    [hasSelectedRunes, isDeckDrafting, isGameOver, isSelectionPhase, showDeckOverlay, showOverloadOverlay, showRulesOverlay, showSettingsOverlay],
  );

  useEffect(() => {
    if (!allowKeyboardNavigation && activeElement !== null) {
      setActiveElement(null);
    }
  }, [activeElement, allowKeyboardNavigation]);

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

    resetTooltipCards();
  }, [activeElement, allowKeyboardNavigation, computeSelectionRunesForTooltip, resetTooltipCards, runeforgeSlotLayouts, setTooltipCards]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showSettingsOverlay) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        toggleSettingsOverlay();
        return;
      }

      if (!allowKeyboardNavigation) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          handleNavigation('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleNavigation('right');
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleNavigation('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleNavigation('down');
          break;
        case 'Enter':
        case ' ': // Space
        case 'Spacebar': {
          event.preventDefault();
          if (activeElement?.type === 'settings') {
            toggleSettingsOverlay();
            return;
          }

          selectActiveRune();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeElement, allowKeyboardNavigation, handleNavigation, selectActiveRune, showSettingsOverlay, toggleSettingsOverlay]);


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
      currentPlayerId: player.id,
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
      activeElement,
      runeforges,
      centerPool,
      playerLockedLines,
      playerHiddenPatternSlots,
      animatingRuneIds,
      hiddenCenterRuneIds,
      onRuneClick: handleRuneClick,
      onCenterRuneClick: handleCenterRuneClick,
      onCancelSelection: handleCancelSelection,
      onPlaceRunes: handlePatternLinePlacement,
      onPlaceRunesInFloor: handlePlaceRunesInFloorWrapper,
      returnToStartScreen,
    }),
    [
      animatingRuneIds,
      activeElement,
      centerPool,
      displayedArmor,
      displayedHealth,
      currentGame,
      draftSource,
      handleCancelSelection,
      handleCenterRuneClick,
      handlePatternLinePlacement,
      handlePlaceRunesInFloorWrapper,
      handleRuneClick,
      hasSelectedRunes,
      hiddenCenterRuneIds,
      isSelectionPhase,
      isGameOver,
      player,
      runesPerRuneforge,
      playerHiddenPatternSlots,
      playerLockedLines,
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
      onOpenDeckOverlay: handleOpenDeckOverlay,
      onOpenOverloadOverlay: handleOpenOverloadOverlay,
      onOpenSettings: handleOpenSettings,
      startNextSoloGame: startNextSoloGame,
    }),
    [
      displayedArcaneDust,
      currentGame,
      gameState.deckDraftState,
      fullDeck.length,
      handleOpenDeckOverlay,
      handleOpenOverloadOverlay,
      isDeckDrafting,
      displayedRunePowerTotal,
      selectDeckDraftRuneforge,
      outcome,
      runeScore,
      playerStats,
      targetScore,
      startNextSoloGame,
      handleOpenSettings,
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
          onClose={handleCloseDeckOverlay}
          isDeckDrafting={isDeckDrafting}
          onDisenchantRune={disenchantRuneFromDeck}
        />
      )}

      {showOverloadOverlay && (
        <OverloadOverlay
          overloadRunes={overloadRunes}
          playerName={player.name}
          onClose={handleCloseOverloadOverlay}
        />
      )}
      {showSettingsOverlay && (
        <SettingsOverlay
        onClose={toggleSettingsOverlay}
        soundVolume={soundVolume}
        isMusicMuted={isMusicMuted}
        onVolumeChange={handleVolumeChange}
        onToggleMusic={handleToggleMusic}
        onQuitRun={returnToStartScreen}
        showQuitRun={true}
        playClickSound={playClickSound}
      />
      )
      }
      <RuneAnimation animatingRunes={placementAnimatingRunes} onAnimationComplete={handlePlacementAnimationComplete} />
      <RuneAnimation animatingRunes={centerAnimatingRunes} onAnimationComplete={handleRuneforgeAnimationComplete} />
    </div>
  );
}
