/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useEffect, useState } from 'react';
import { DeckOverlay } from './DeckOverlay';
import { OverloadOverlay } from './OverloadOverlay';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { useSelectionStore } from '../../../state/stores/selectionStore';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useUIStore } from '../../../state/stores/uiStore';
import { useRunePlacementAnimations } from '../../../hooks/useRunePlacementAnimations';
import { SoloGameView } from './SoloGameBoard';
import { computeBoardScale, SCALING_CONFIG } from '../../../utils/boardScaling';

export function GameContainer() {
  const shouldTriggerEndRound = useGameplayStore((state) => state.shouldTriggerEndRound);
  const turnPhase = useGameplayStore((state) => state.turnPhase);
  const player = useGameplayStore((state) => state.player);
  const selectedRunes = useSelectionStore((state) => state.selectedRunes);
  const draftSource = useSelectionStore((state) => state.draftSource);
  const moveRunesToWall = useGameplayStore((state) => state.moveRunesToWall);
  const endRound = useGameplayStore((state) => state.endRound);
  const overloadSoundPending = useGameplayStore((state) => state.overloadSoundPending);
  const acknowledgeOverloadSound = useGameplayStore((state) => state.acknowledgeOverloadSound);
  const channelSoundPending = useGameplayStore((state) => state.channelSoundPending);
  const acknowledgeChannelSound = useGameplayStore((state) => state.acknowledgeChannelSound);
  const soundVolume = useUIStore((state) => state.soundVolume);
  const showSettingsOverlay = useUIStore((state) => state.showSettingsOverlay);
  const setPlayerHiddenPatternSlots = useUIStore((state) => state.setPlayerHiddenPatternSlots);


  const showDeckOverlay = useUIStore((state) => state.showDeckOverlay);
  const showOverloadOverlay = useUIStore((state) => state.showOverloadOverlay);
  const {
    animatingRunes: placementAnimatingRunes,
    activeAnimatingRunes,
    hiddenPatternSlots,
    handlePlacementAnimationComplete,
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

  useEffect(() => {
    setPlayerHiddenPatternSlots(hiddenPatternSlots);
  }, [hiddenPatternSlots, setPlayerHiddenPatternSlots]);

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

  const scaledBoardWidth = SCALING_CONFIG.baseWidth * boardScale;
  const scaledBoardHeight = SCALING_CONFIG.baseHeight * boardScale;

  return (
    <div
      className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_#2b184f_0%,_#0c041c_65%,_#05010d_100%)] text-[#f5f3ff] flex items-center justify-center box-border relative"
    >
      <div className="relative" style={{ width: `${scaledBoardWidth}px`, height: `${scaledBoardHeight}px` }}>
        <div
          className="absolute top-0 left-0 origin-top-left bg-[rgba(9,3,24,0.85)] rounded-[36px] border border-white/12 shadow-[0_40px_120px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden backdrop-blur-[14px]"
          style={{
            width: `${SCALING_CONFIG.baseWidth}px`,
            height: `${SCALING_CONFIG.baseHeight}px`,
            transform: `scale(${boardScale})`,
            transformOrigin: 'top left',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <SoloGameView/>
        </div>
      </div>

      {showDeckOverlay && (<DeckOverlay/>)}
      {showOverloadOverlay && (<OverloadOverlay/>)}
      {showSettingsOverlay && (
        <SettingsOverlay onQuitRun={useGameplayStore.getState().returnToStartScreen}/>
      )}
      <RuneAnimation animatingRunes={placementAnimatingRunes} onAnimationComplete={handlePlacementAnimationComplete} />
    </div>
  );
};
