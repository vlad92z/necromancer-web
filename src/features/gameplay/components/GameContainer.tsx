/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { RuneZoneOverlay } from './DeckOverlay';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useGameplayActions } from '../../../hooks/useGameActions';
import { useEnemyAttackSoundSignal, useRuneSoundSignals, useShieldSoundSignal, useUIOverlayState } from '../../../hooks/useGameState';
import { useEnemyAttackSound } from '../../../hooks/useEnemyAttackSound';
import { useRuneSound } from '../../../hooks/useRuneSound';
import { useShieldSound } from '../../../hooks/useShieldSound';
import type { RuneSoundSignals, RuneType } from '../../../types/game';
import { SoloGameView } from './SoloGameBoard';
import { computeBoardScale, SCALING_CONFIG } from '../../../utils/boardScaling';

const RUNE_SOUND_TYPES: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind', 'Lightning'];

export function GameContainer() {
  const { returnToStartScreen } = useGameplayActions();
  const { showSettingsOverlay, activeRuneZoneOverlay } = useUIOverlayState();
  const runeSoundSignals = useRuneSoundSignals();
  const enemyAttackSoundSignal = useEnemyAttackSoundSignal();
  const shieldSoundSignal = useShieldSoundSignal();
  const playRuneSound = useRuneSound();
  const playEnemyAttackSound = useEnemyAttackSound();
  const playShieldSound = useShieldSound();
  const previousRuneSoundSignalsRef = useRef<RuneSoundSignals>(runeSoundSignals);
  const previousEnemyAttackSoundSignalRef = useRef(enemyAttackSoundSignal);
  const previousShieldSoundSignalRef = useRef(shieldSoundSignal);
  const hiddenWallSlots = useMemo(() => new Set<string>(), []);

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

  useEffect(() => {
    RUNE_SOUND_TYPES.forEach((runeType) => {
      const signalDelta = runeSoundSignals[runeType] - previousRuneSoundSignalsRef.current[runeType];
      for (let index = 0; index < signalDelta; index += 1) {
        playRuneSound(runeType);
      }
    });

    previousRuneSoundSignalsRef.current = runeSoundSignals;
  }, [playRuneSound, runeSoundSignals]);

  useEffect(() => {
    if (enemyAttackSoundSignal <= previousEnemyAttackSoundSignalRef.current) {
      previousEnemyAttackSoundSignalRef.current = enemyAttackSoundSignal;
      return;
    }

    playEnemyAttackSound();
    previousEnemyAttackSoundSignalRef.current = enemyAttackSoundSignal;
  }, [enemyAttackSoundSignal, playEnemyAttackSound]);

  useEffect(() => {
    if (shieldSoundSignal <= previousShieldSoundSignalRef.current) {
      previousShieldSoundSignalRef.current = shieldSoundSignal;
      return;
    }

    playShieldSound();
    previousShieldSoundSignalRef.current = shieldSoundSignal;
  }, [playShieldSound, shieldSoundSignal]);

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
            hiddenWallSlots={hiddenWallSlots}
          />
        </div>
      </div>

      {activeRuneZoneOverlay && (<RuneZoneOverlay zone={activeRuneZoneOverlay} />)}
      {showSettingsOverlay && (
        <SettingsOverlay onQuitRun={returnToStartScreen} />
      )}
    </div>
  );
};
