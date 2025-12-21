/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useEffect, useState } from 'react';
import type { GameState, RuneType, Rune } from '../../../types/game';
import { DeckOverlay } from './DeckOverlay';
import { OverloadOverlay } from './OverloadOverlay';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useClickSound } from '../../../hooks/useClickSound';
import { useUIStore } from '../../../state/stores/uiStore';
import { SoloGameView } from './SoloGameBoard';
import type { ActiveElement } from './keyboardNavigation';

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

export interface GameContainerSharedProps {
  // Core context
  player: GameState['player'];
  displayedHealth: number;
  displayedArmor: number;
  currentPlayerIndex: number;
  currentPlayerId: string;
  gameIndex: number;
  overloadDamage: number;
  isSelectionPhase: boolean;
  isGameOver: boolean;
  runeforgeDraftStage: GameState['runeforgeDraftStage'];

  // Selection state
  selectedRuneType: RuneType | null;
  selectedRunes: Rune[];
  hasSelectedRunes: boolean;
  draftSource: GameState['draftSource'];
  activeElement: ActiveElement | null;

  // Board data
  runeforges: GameState['runeforges'];

  // Locks and visibility
  playerLockedLines: number[];
  playerHiddenPatternSlots?: Set<string>;

  // Actions
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onCancelSelection: () => void;
  onPlaceRunes: (patternLineIndex: number) => void;
  onPlaceRunesInFloor: () => void;
  returnToStartScreen: () => void;
}

export interface GameContainerHandle {
  handleKeyDown: (event: KeyboardEvent) => boolean;
}

export function GameContainer() {
  const returnToStartScreen = useGameplayStore((state) => state.returnToStartScreen);
  // const overloadSoundPending = useGameplayStore((state) => state.overloadSoundPending);
  // const acknowledgeOverloadSound = useGameplayStore((state) => state.acknowledgeOverloadSound);
  // const channelSoundPending = useGameplayStore((state) => state.channelSoundPending);
  // const acknowledgeChannelSound = useGameplayStore((state) => state.acknowledgeChannelSound);
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay);
  const showDeckOverlay = useUIStore((state) => state.showDeckOverlay);
  const showOverloadOverlay = useUIStore((state) => state.showOverloadOverlay);
  const playClickSound = useClickSound();

  // useRunePlacementSounds(
  //   placementAnimatingRunes,
  //   0.35,//sound volume
  //   overloadSoundPending,
  //   acknowledgeOverloadSound,
  //   channelSoundPending,
  //   acknowledgeChannelSound
  // );

  // const handleVolumeChange = useCallback(
  //   (event: ChangeEvent<HTMLInputElement>) => {
  //     const nextValue = Number.parseFloat(event.currentTarget.value);
  //     if (!Number.isFinite(nextValue)) {
  //       return;
  //     }
  //     setSoundVolume(nextValue / 100);
  //   },
  //   [setSoundVolume],
  // );

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
          <SoloGameView boardScale={boardScale} />
        </div>
      </div>

      {showDeckOverlay && (
        <DeckOverlay/>
      )}

      {showOverloadOverlay && (
        <OverloadOverlay/>
      )}
      {showSettingsOverlay && (
        <SettingsOverlay/>
      )
      }
    </div>
  );
}
