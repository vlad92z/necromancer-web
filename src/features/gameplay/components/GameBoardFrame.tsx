/**
 * GameBoardFrame - shared logic and layout shell for the solo board
 */

import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { ChangeEvent } from 'react';
import type { GameState, RuneType, Rune } from '../../../types/game';
import { RulesOverlay } from './RulesOverlay';
import { DeckOverlay } from './DeckOverlay';
import { useGameActions } from '../../../hooks/useGameActions';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { VolumeControl } from '../../../components/VolumeControl';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useBackgroundMusic } from '../../../hooks/useBackgroundMusic';
import { useUIStore } from '../../../state/stores/uiStore';
import type { SoloStatsProps } from './Player/SoloStats';
import { useRunePlacementAnimations } from '../../../hooks/useRunePlacementAnimations';
import { getArcaneDustReward } from '../../../utils/arcaneDust';

const BOARD_BASE_WIDTH = 1500;
const BOARD_BASE_HEIGHT = 1000;
const BOARD_PADDING = 80;
const MIN_BOARD_SCALE = 0.55;
const MIN_AVAILABLE_SIZE = 520;

const computeBoardScale = (width: number, height: number): number => {
  const availableWidth = Math.max(width - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const availableHeight = Math.max(height - BOARD_PADDING, MIN_AVAILABLE_SIZE);
  const rawScale = Math.min(availableWidth / BOARD_BASE_WIDTH, availableHeight / BOARD_BASE_HEIGHT);
  const clamped = Math.min(rawScale, 1);
  return Math.max(clamped, MIN_BOARD_SCALE);
};

export interface GameBoardProps {
  gameState: GameState;
}

export interface SoloVariantData {
  soloOutcome: GameState['soloOutcome'];
  soloRuneScore: { currentScore: number; targetScore: number } | null;
  soloStats: SoloStatsProps;
  soloTargetScore: number;
  runePowerTotal: number;
  arcaneDustReward: number;
  deckDraftState: GameState['deckDraftState'];
  isDeckDrafting: boolean;
  onSelectDeckDraftRuneforge: (runeforgeId: string) => void;
  onOpenDeckOverlay: () => void;
  onStartNextGame: () => void;
}

export interface GameBoardSharedProps {
  // Core context
  player: GameState['player'];
  currentPlayerIndex: number;
  currentPlayerId: string;
  game: number;
  isDraftPhase: boolean;
  isGameOver: boolean;
  activeArtefactIds: GameState['activeArtefacts'];

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

export interface GameBoardFrameProps extends GameBoardProps {
  renderContent: (shared: GameBoardSharedProps, variantData: SoloVariantData) => ReactElement | null;
}

export function GameBoardFrame({ gameState, renderContent }: GameBoardFrameProps) {
  const {
    player,
    runeforges,
    centerPool,
    selectedRunes,
    turnPhase,
    lockedPatternLines,
    shouldTriggerEndRound,
    draftSource,
    strain,
    soloDeckTemplate,
    activeArtefacts,
  } = gameState;
  const currentGame = useGameplayStore((state) => state.game);
  const soloOutcome = gameState.soloOutcome;
  const runePowerTotal = gameState.runePowerTotal;
  const soloTargetScore = gameState.soloTargetScore;
  const {
    draftRune,
    draftFromCenter,
    placeRunes,
    moveRunesToWall,
    placeRunesInFloor,
    cancelSelection,
    selectDeckDraftRuneforge,
    disenchantRuneFromDeck,
    forceSoloVictory,
    startNextSoloGame,
  } = useGameActions();
  const returnToStartScreen = useGameplayStore((state) => state.returnToStartScreen);
  const endRound = useGameplayStore((state) => state.endRound);
  const overloadSoundPending = useGameplayStore((state) => state.overloadSoundPending);
  const acknowledgeOverloadSound = useGameplayStore((state) => state.acknowledgeOverloadSound);
  const soundVolume = useUIStore((state) => state.soundVolume);
  const setSoundVolume = useUIStore((state) => state.setSoundVolume);

  const [showRulesOverlay, setShowRulesOverlay] = useState(false);
  const [showDeckOverlay, setShowDeckOverlay] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem('musicMuted') === 'true';
  });
  const isDraftPhase = turnPhase === 'draft';
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
  
  useRunePlacementSounds([player], activeAnimatingRunes, soundVolume, overloadSoundPending, acknowledgeOverloadSound);
  useBackgroundMusic(!isMusicMuted, soundVolume);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('musicMuted', isMusicMuted ? 'true' : 'false');
  }, [isMusicMuted]);

  const soloRuneScore = {
        currentScore: runePowerTotal,
        targetScore: soloTargetScore,
      };

  const soloStats = (() => {
        // const strainMitigation = player.wall
        //   .flat()
          // .reduce((total, cell) => total + getEffectValue(cell.effects, 'StrainMitigation'), 0);
        const overloadMultiplier = strain;//applyStressMitigation(strain, strainMitigation);

        return {
          isActive: true,
          overloadMultiplier,
          game: currentGame,
          deckCount: player.deck.length,
        };
      })();

  const handleRuneClick = (runeforgeId: string, runeType: RuneType, runeId: string) => {
    console.log('rune clicked');
    draftRune(runeforgeId, runeType, runeId);
  };

  const handleCenterRuneClick = (runeType: RuneType, runeId: string) => {
    draftFromCenter(runeType, runeId);
  };

  const playerHiddenPatternSlots = hiddenPatternSlots[player.id];
  const playerLockedLines = lockedPatternLines[player.id];

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

  const handleCancelSelection = () => {
    if (isAnimatingPlacement) {
      return;
    }
    cancelSelection();
  };

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
  const sharedProps: GameBoardSharedProps = {
    // Core context
    player,
    currentPlayerIndex: 0,
    currentPlayerId: player.id,
    game: currentGame,
    isDraftPhase,
    isGameOver,
    activeArtefactIds: activeArtefacts,

    // Selection state
    selectedRuneType,
    selectedRunes,
    hasSelectedRunes,
    draftSource,

    // Board data
    runeforges,
    centerPool,

    // Locks and visibility
    playerLockedLines,
    playerHiddenPatternSlots,
    animatingRuneIds,
    hiddenCenterRuneIds,

    // Actions
    onRuneClick: handleRuneClick,
    onCenterRuneClick: handleCenterRuneClick,
    onCancelSelection: handleCancelSelection,
    onPlaceRunes: handlePatternLinePlacement,
    onPlaceRunesInFloor: handlePlaceRunesInFloorWrapper,
    returnToStartScreen,
  };
  const variantData: SoloVariantData = {
        soloOutcome,
        soloRuneScore,
        soloStats,
        soloTargetScore,
        runePowerTotal,
      arcaneDustReward: getArcaneDustReward(currentGame),
        deckDraftState: gameState.deckDraftState,
        isDeckDrafting,
        onSelectDeckDraftRuneforge: selectDeckDraftRuneforge,
        onOpenDeckOverlay: () => setShowDeckOverlay(true),
        onStartNextGame: startNextSoloGame,
      };
  const boardContent = renderContent(
    sharedProps,
    variantData,
  );

  return (
    <div
      className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#2b184f_0%,_#0c041c_65%,_#05010d_100%)] text-[#f5f3ff] flex items-center justify-center p-6 box-border relative"
    >
      <div className="absolute left-4 top-4 z-30 flex flex-col gap-2">
        <button
          type="button"
          onClick={forceSoloVictory}
          className="hidden rounded-lg border border-emerald-400/50 bg-emerald-900/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50 transition hover:border-emerald-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          Instant Win
        </button>
        <button
          type="button"
          onClick={returnToStartScreen}
          className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          Quit Run
        </button>
        <div className="mt-1 rounded-xl border border-sky-400/40 bg-[rgba(9,12,26,0.9)] px-4 py-3 text-left shadow-[0_14px_36px_rgba(0,0,0,0.45)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">Game</div>
          <div className="text-2xl font-extrabold text-white leading-tight">{currentGame}</div>
        </div>
      </div>
      <div className="absolute top-4 right-4 w-full flex justify-end pointer-events-none z-30">
        <VolumeControl soundVolume={soundVolume} onVolumeChange={handleVolumeChange} isMusicMuted={isMusicMuted} onToggleMusic={handleToggleMusic} />
      </div>

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
          {boardContent}
        </div>
      </div>

      {showRulesOverlay && <RulesOverlay onClose={() => setShowRulesOverlay(false)} />}

      {showDeckOverlay && (
        <DeckOverlay
          deck={player.deck}
          fullDeck={fullDeck}
          playerName={player.name}
          onClose={() => setShowDeckOverlay(false)}
          isDeckDrafting={isDeckDrafting}
          onDisenchantRune={disenchantRuneFromDeck}
        />
      )}

      <RuneAnimation animatingRunes={placementAnimatingRunes} onAnimationComplete={handlePlacementAnimationComplete} />
      <RuneAnimation animatingRunes={centerAnimatingRunes} onAnimationComplete={handleRuneforgeAnimationComplete} />
    </div>
  );
}
