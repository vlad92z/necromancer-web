/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { GameState, RuneType, Rune } from '../../../types/game';
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
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay);
  const toggleSettingsOverlay = useUIStore((state) => state.toggleSettingsOverlay);
  const arcaneDust = useArtefactStore((state) => state.arcaneDust);
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
      currentScore: runePowerTotal,
      targetScore: targetScore,
    }),
    [runePowerTotal, targetScore],
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
      runePowerTotal,
      arcaneDust,
      arcaneDustReward: getArcaneDustReward(currentGame),
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
      handleOpenDeckOverlay,
      handleOpenOverloadOverlay,
      isDeckDrafting,
      runePowerTotal,
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
