/**
 * GameContainer - shared logic and layout shell for the solo board
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { RuneZoneOverlay } from './DeckOverlay';
import { SettingsOverlay } from '../../../components/SettingsOverlay';
import { useGameplayActions } from '../../../hooks/useGameActions';
import {
  useEnemyAttackSoundSignal,
  useRuneSoundSignals,
  useShieldSoundSignal,
  useSoloPhase,
  useUIOverlayState,
} from '../../../hooks/useGameState';
import { useEnemyAttackSound } from '../../../hooks/useEnemyAttackSound';
import { useRuneSound } from '../../../hooks/useRuneSound';
import { useShieldSound } from '../../../hooks/useShieldSound';
import type { RuneSoundSignals, RuneType } from '../../../types/game';
import { SoloGameView } from './SoloGameBoard';
import { computeBoardScale, SCALING_CONFIG } from '../../../utils/boardScaling';
import { SoloMapView } from './map/SoloMapView';

const RUNE_SOUND_TYPES: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind', 'Lightning'];

export function GameContainer() {
  const { returnToStartScreen } = useGameplayActions();
  const { showSettingsOverlay, activeRuneZoneOverlay } = useUIOverlayState();
  const soloPhase = useSoloPhase();
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
      className="pixel-screen relative box-border flex min-h-screen w-full items-center justify-center"
    >
      <div className="relative" style={{ width: `${scaledBoardWidth}px`, height: `${scaledBoardHeight}px` }}>
        <div
          className="pixel-game-shell absolute left-0 top-0 flex origin-top-left flex-col overflow-hidden"
          style={{
            width: `${SCALING_CONFIG.baseWidth}px`,
            height: `${SCALING_CONFIG.baseHeight}px`,
            transform: `scale(${boardScale})`,
            transformOrigin: 'top left',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {soloPhase === 'map'
            ? <SoloMapView />
            : (
              <SoloGameView
                hiddenWallSlots={hiddenWallSlots}
              />
            )}
        </div>
      </div>

      {soloPhase !== 'map' && activeRuneZoneOverlay && (<RuneZoneOverlay zone={activeRuneZoneOverlay} />)}
      {showSettingsOverlay && (
        <SettingsOverlay onQuitRun={returnToStartScreen} />
      )}
    </div>
  );
};
