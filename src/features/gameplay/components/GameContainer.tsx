/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useEffect, useMemo, useState } from 'react';
import { DeckOverlay } from './DeckOverlay';
import { OverloadOverlay } from './OverloadOverlay';
import { RuneAnimation } from '../../../components/RuneAnimation';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useGameplayActions } from '../../../hooks/useGameActions';
import { useGameplayContainerState, useGameplayOverloadState, useSelectionState, useSoundVolume, useUIOverlayState } from '../../../hooks/useGameState';
import { useRunePlacementSounds } from '../../../hooks/useRunePlacementSounds';
import { useRunePlacementAnimations } from '../../../hooks/useRunePlacementAnimations';
import { SoloGameView } from './SoloGameBoard';
import { computeBoardScale, SCALING_CONFIG } from '../../../utils/boardScaling';

export function GameContainer() {
  const { player, channelSoundPending, overloadSoundPending } =
    useGameplayContainerState();
  const { acknowledgeOverloadSound, acknowledgeChannelSound, returnToStartScreen } =
    useGameplayActions();
  const { selectedRunes, draftSource } = useSelectionState();
  const { overloadedRuneCount } = useGameplayOverloadState();
  const soundVolume = useSoundVolume();
  const { showSettingsOverlay, showDeckOverlay, showOverloadOverlay } = useUIOverlayState();
  const {
    animatingRunes: placementAnimatingRunes,
    activeAnimatingRunes,
    hiddenPatternSlots,
    isAnimatingPlacement,
    handlePlacementAnimationComplete,
  } = useRunePlacementAnimations({
    player,
    selectedRunes,
    draftSource,
    overloadRuneCount: overloadedRuneCount,
  });
  const animatingRuneIdSet = useMemo(
    () => new Set(activeAnimatingRunes.map((rune) => rune.id)),
    [activeAnimatingRunes],
  );

  useRunePlacementSounds(
    activeAnimatingRunes,
    soundVolume,
    overloadSoundPending,
    acknowledgeOverloadSound,
    channelSoundPending,
    acknowledgeChannelSound
  );

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
          <SoloGameView
            animatingRuneIdSet={animatingRuneIdSet}
            hiddenPatternSlots={hiddenPatternSlots}
            isPlacementAnimating={isAnimatingPlacement}
          />
        </div>
      </div>

      {showDeckOverlay && (<DeckOverlay />)}
      {showOverloadOverlay && (<OverloadOverlay />)}
      {showSettingsOverlay && (
        <SettingsOverlay onQuitRun={returnToStartScreen} />
      )}
      <RuneAnimation animatingRunes={placementAnimatingRunes} onAnimationComplete={handlePlacementAnimationComplete} />
    </div>
  );
};
