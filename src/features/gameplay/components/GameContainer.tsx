/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { ActiveElement, GameState, RuneType, Rune } from '../../../types/game';
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
import { buildNavigationGrid, findNextElement, findElementPosition, getFirstAvailableElement } from '../../../utils/navigationGrid';
import { buildTextTooltipCard, buildOverloadPlacementTooltipCards, buildRuneTooltipCards, buildPatternLinePlacementTooltipCards, buildPatternLineExistingTooltipCards, buildArtefactTooltipCards } from '../../../utils/tooltipCards';
import { isPatternLinePlacementValid } from '../../../utils/patternLineHelpers';
import { collectSegmentCells } from '../../../utils/scoring';
import overloadSvg from '../../../assets/stats/overload.svg';
import deckSvg from '../../../assets/stats/deck.svg';

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
  const soundVolume = useUIStore((state) => state.soundVolume);
  const setSoundVolume = useUIStore((state) => state.setSoundVolume);
  const isMusicMuted = useUIStore((state) => state.isMusicMuted);
  const setMusicMuted = useUIStore((state) => state.setMusicMuted);
  const activeElement = useGameplayStore((state) => state.activeElement);
  const setActiveElement = useGameplayStore((state) => state.setActiveElement);
  const resetActiveElement = useGameplayStore((state) => state.resetActiveElement);
  const tooltipOverrideActive = useGameplayStore((state) => state.tooltipOverrideActive);
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay);
  const toggleSettingsOverlay = useUIStore((state) => state.toggleSettingsOverlay);
  const arcaneDust = useArtefactStore((state) => state.arcaneDust);
  const selectedArtefactIds = useArtefactStore((state) => state.selectedArtefactIds);
  const playArcaneDust = useArcaneDustSound();
  const playClickSound = useClickSound();

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

  const playerHiddenPatternSlots = useMemo(
    () => hiddenPatternSlots[player.id],
    [hiddenPatternSlots, player.id],
  );
  const playerLockedLines = useMemo(() => lockedPatternLines[player.id] ?? [], [lockedPatternLines, player.id]);

  const navigationGrid = useMemo(
    () =>
      buildNavigationGrid({
        runeforges,
        runesPerRuneforge,
        patternLines: player.patternLines,
        wall: player.wall,
        artefactIds: selectedArtefactIds,
      }),
    [player.patternLines, player.wall, runeforges, runesPerRuneforge, selectedArtefactIds]
  );

  const isElementActive = useCallback(
    (element: ActiveElement) => {
      switch (element.type) {
        case 'runeforge-rune': {
          const runeforge = runeforges[element.runeforgeIndex];
          return Boolean(runeforge?.runes[element.runeIndex]);
        }
        case 'pattern-line':
          return Boolean(player.patternLines[element.lineIndex]);
        case 'scoring-wall':
          return Boolean(player.wall[element.row]?.[element.col]?.runeType);
        case 'artefact':
          return element.artefactIndex < selectedArtefactIds.length;
        default:
          return true;
      }
    },
    [player.patternLines, player.wall, runeforges, selectedArtefactIds.length]
  );

  const validPatternLineIndexes = useMemo(() => {
    if (!hasSelectedRunes || !selectedRuneType) {
      return [];
    }
    return player.patternLines
      .map((line, index) => ({ line, index }))
      .filter(({ line, index }) =>
        isPatternLinePlacementValid(line, index, selectedRuneType, player.wall, playerLockedLines)
      )
      .map(({ index }) => index);
  }, [hasSelectedRunes, player.patternLines, player.wall, playerLockedLines, selectedRuneType]);

  useEffect(() => {
    const fallbackElement = getFirstAvailableElement(navigationGrid, isElementActive);
    if (!activeElement && fallbackElement) {
      setActiveElement(fallbackElement);
      return;
    }

    if (
      activeElement &&
      (!findElementPosition(navigationGrid, activeElement) || !isElementActive(activeElement))
    ) {
      if (fallbackElement) {
        setActiveElement(fallbackElement);
      } else {
        resetActiveElement();
      }
    }
  }, [activeElement, isElementActive, navigationGrid, resetActiveElement, setActiveElement]);

  useEffect(() => {
    if (!hasSelectedRunes) {
      return;
    }
    if (validPatternLineIndexes.length > 0) {
      setActiveElement({ type: 'pattern-line', lineIndex: validPatternLineIndexes[0] });
      return;
    }
    setActiveElement({ type: 'overload' });
  }, [hasSelectedRunes, setActiveElement, validPatternLineIndexes]);

  const prevArcaneDustRef = useRef<number>(arcaneDust);
  useEffect(() => {
    if (arcaneDust > prevArcaneDustRef.current) {
      playArcaneDust();
    }
    prevArcaneDustRef.current = arcaneDust;
  }, [arcaneDust, playArcaneDust]);

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
    resetActiveElement();
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

  const moveActiveElement = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const next = findNextElement(navigationGrid, activeElement, direction, isElementActive);
      if (next) {
        setActiveElement(next);
      }
    },
    [activeElement, isElementActive, navigationGrid, setActiveElement]
  );

  const handleSelectActiveElement = useCallback(
    (element: ActiveElement | null) => {
      if (!element) {
        return;
      }

      switch (element.type) {
        case 'settings':
          handleOpenSettings();
          break;
        case 'overload':
          if (hasSelectedRunes) {
            handlePlaceRunesInFloorWrapper();
          } else {
            handleOpenOverloadOverlay();
          }
          break;
        case 'deck':
          handleOpenDeckOverlay();
          break;
        case 'runeforge-rune': {
          const runeforge = runeforges[element.runeforgeIndex];
          const rune = runeforge?.runes[element.runeIndex];
          if (runeforge && rune) {
            handleRuneClick(runeforge.id, rune.runeType, rune.id);
          }
          break;
        }
        case 'pattern-line': {
          const line = player.patternLines[element.lineIndex];
          if (
            line &&
            isPatternLinePlacementValid(line, element.lineIndex, selectedRuneType ?? null, player.wall, playerLockedLines) &&
            hasSelectedRunes
          ) {
            handlePatternLinePlacement(element.lineIndex);
          }
          break;
        }
        case 'scoring-wall':
        case 'artefact':
        default:
          break;
      }
    },
    [
      handleOpenDeckOverlay,
      handleOpenOverloadOverlay,
      handleOpenSettings,
      handlePatternLinePlacement,
      handlePlaceRunesInFloorWrapper,
      handleRuneClick,
      hasSelectedRunes,
      player.patternLines,
      player.wall,
      playerLockedLines,
      runeforges,
      selectedRuneType,
    ]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (hasSelectedRunes) {
          event.preventDefault();
          handleCancelSelection();
        } else {
          handleOpenSettings();
        }
        return;
      }

      if (showSettingsOverlay || showDeckOverlay || showOverloadOverlay || showRulesOverlay || isDeckDrafting) {
        return;
      }

      const handleVerticalSelection = (direction: 'up' | 'down') => {
        const targets: ActiveElement[] = [];
        if (hasSelectedRunes) {
          targets.push({ type: 'overload' });
          validPatternLineIndexes.forEach((lineIndex) => targets.push({ type: 'pattern-line', lineIndex }));
        }
        if (!hasSelectedRunes || targets.length === 0) {
          moveActiveElement(direction);
          return;
        }

        const currentIndex = targets.findIndex((target) =>
          activeElement &&
          target.type === activeElement.type &&
          ((target.type === 'overload' && activeElement.type === 'overload') ||
            (target.type === 'pattern-line' &&
              activeElement.type === 'pattern-line' &&
              target.lineIndex === activeElement.lineIndex))
        );
        const nextIndex = direction === 'up'
          ? Math.max(0, currentIndex <= 0 ? 0 : currentIndex - 1)
          : Math.min(targets.length - 1, currentIndex === -1 ? 0 : currentIndex + 1);
        setActiveElement(targets[nextIndex] ?? targets[0]);
      };

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handleVerticalSelection('up');
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        handleVerticalSelection('down');
      } else if (event.key === 'ArrowLeft') {
        if (!hasSelectedRunes) {
          event.preventDefault();
          moveActiveElement('left');
        }
      } else if (event.key === 'ArrowRight') {
        if (!hasSelectedRunes) {
          event.preventDefault();
          moveActiveElement('right');
        }
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelectActiveElement(activeElement);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeElement,
    handleCancelSelection,
    handleOpenSettings,
    handleSelectActiveElement,
    isDeckDrafting,
    moveActiveElement,
    hasSelectedRunes,
    validPatternLineIndexes,
    setActiveElement,
    showDeckOverlay,
    showOverloadOverlay,
    showRulesOverlay,
    showSettingsOverlay,
  ]);

  useEffect(() => {
    if (!activeElement) {
      if (!tooltipOverrideActive) {
        resetTooltipCards();
      }
      return;
    }

    const resetIfAllowed = () => {
      if (!tooltipOverrideActive) {
        resetTooltipCards();
      }
    };

    if (activeElement.type === 'settings') {
      resetIfAllowed();
      return;
    }

    if (activeElement.type === 'overload') {
      if (hasSelectedRunes) {
        setTooltipCards(buildOverloadPlacementTooltipCards(selectedRunes, strain), true);
        return;
      }
      const overloadTooltip = `Overload deals ${strain} damage per rune. ${overloadRunes.length} runes are currently overloaded.`;
      setTooltipCards(buildTextTooltipCard('overload-tooltip', 'Overload', overloadTooltip, overloadSvg));
      return;
    }

    if (activeElement.type === 'deck') {
      const deckValue = Math.max(0, player.deck.length);
      const deckRemaining = Math.max(0, deckValue - 20);
      const deckTooltip = `You have ${deckRemaining} runes remaining.`;
      setTooltipCards(buildTextTooltipCard('deck-tooltip', 'Deck', deckTooltip, deckSvg));
      return;
    }

    if (activeElement.type === 'runeforge-rune') {
      const runeforge = runeforges[activeElement.runeforgeIndex];
      const rune = runeforge?.runes[activeElement.runeIndex];
      if (!runeforge || !rune) {
        resetIfAllowed();
        return;
      }
      const isRuneforgeDisabled = runeforge.disabled ?? false;
      const isGlobalDraftStage = runeforgeDraftStage === 'global';
      const isGlobalSelection =
        draftSource?.type === 'runeforge' && draftSource.selectionMode === 'global';
      const isRuneforgeSelected = draftSource?.type === 'runeforge' && draftSource.runeforgeId === runeforge.id;
      const isAffectedByGlobalSelection = Boolean(
        draftSource?.affectedRuneforges?.some((forge) => forge.runeforgeId === runeforge.id)
      );
      const selectionActive = isGlobalSelection
        ? hasSelectedRunes && isAffectedByGlobalSelection
        : hasSelectedRunes && isRuneforgeSelected;

      if (selectionActive || hasSelectedRunes || isRuneforgeDisabled) {
        resetIfAllowed();
        return;
      }

      const selectionRunes = isGlobalDraftStage
        ? runeforges
            .filter((forge) => !(forge.disabled ?? false))
            .flatMap((forge) => forge.runes.filter((candidate) => candidate.runeType === rune.runeType))
        : runeforge.runes.filter((candidate) => candidate.runeType === rune.runeType);
      if (selectionRunes.length > 0) {
        setTooltipCards(buildRuneTooltipCards(selectionRunes, rune.id));
      } else {
        resetIfAllowed();
      }
      return;
    }

    if (activeElement.type === 'pattern-line') {
      const line = player.patternLines[activeElement.lineIndex];
      if (!line) {
        resetIfAllowed();
        return;
      }
      const isPlacementTarget = hasSelectedRunes
        ? isPatternLinePlacementValid(line, activeElement.lineIndex, selectedRuneType ?? null, player.wall, playerLockedLines)
        : false;

      if (selectedRunes.length > 0) {
        if (!isPlacementTarget) {
          resetIfAllowed();
          return;
        }
        const tooltipCards = buildPatternLinePlacementTooltipCards({
          selectedRunes,
          patternLineTier: line.tier,
          patternLineCount: line.count,
          strain,
        });
        if (tooltipCards.length > 0) {
          setTooltipCards(tooltipCards, true);
        } else {
          resetIfAllowed();
        }
        return;
      }

      if (line.runeType && line.count > 0) {
        const tooltipCards = buildPatternLineExistingTooltipCards(line);
        if (tooltipCards.length > 0) {
          setTooltipCards(tooltipCards);
        } else {
          resetIfAllowed();
        }
        return;
      }

      resetIfAllowed();
      return;
    }

    if (activeElement.type === 'scoring-wall') {
      const segmentCells = collectSegmentCells(player.wall, activeElement.row, activeElement.col);
      if (segmentCells.length === 0) {
        resetIfAllowed();
        return;
      }
      const primaryCell = segmentCells.find(
        (cell) => cell.row === activeElement.row && cell.col === activeElement.col
      );
      const remainingCells = segmentCells
        .filter((cell) => !(cell.row === activeElement.row && cell.col === activeElement.col))
        .sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row));
      const orderedCells = primaryCell ? [primaryCell, ...remainingCells] : remainingCells;

      const tooltipRunes = orderedCells
        .filter((cell) => cell.runeType !== null)
        .map((cell) => ({
          id: `wall-${cell.row}-${cell.col}`,
          runeType: cell.runeType ?? 'Life',
          effects: cell.effects ?? [],
        }));

      if (tooltipRunes.length > 0) {
        setTooltipCards(buildRuneTooltipCards(tooltipRunes, tooltipRunes[0].id));
      } else {
        resetIfAllowed();
      }
      return;
    }

    if (activeElement.type === 'artefact') {
      if (activeElement.artefactIndex < selectedArtefactIds.length) {
        const artefactId = selectedArtefactIds[activeElement.artefactIndex];
        setTooltipCards(buildArtefactTooltipCards(selectedArtefactIds, artefactId));
      } else {
        resetIfAllowed();
      }
    }
  }, [
    activeElement,
    draftSource,
    hasSelectedRunes,
    overloadRunes.length,
    player.deck.length,
    player.patternLines,
    player.wall,
    playerLockedLines,
    resetTooltipCards,
    runeforgeDraftStage,
    runeforges,
    selectedArtefactIds,
    selectedRuneType,
    selectedRunes,
    setTooltipCards,
    strain,
    tooltipOverrideActive,
  ]);

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
      arcaneDust,
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
      arcaneDust,
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
