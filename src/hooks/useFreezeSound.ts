/**
 * useFreezeSound - plays freeze audio when any pattern line becomes frozen.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { GameState } from '../types/game';
import freezeSoundUrl from '../assets/sounds/freeze.mp3';
import { useUIStore } from '../state/stores/uiStore';

type FrozenPatternLines = GameState['frozenPatternLines'];

export function useFreezeSound(frozenPatternLines: FrozenPatternLines): void {
  const soundVolume = useUIStore((state) => state.soundVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousFrozenKeysRef = useRef<string[]>([]);

  const frozenKeys = useMemo(() => {
    const keys: string[] = [];
    Object.entries(frozenPatternLines).forEach(([playerId, lines]) => {
      lines.forEach((lineIndex) => {
        keys.push(`${playerId}:${lineIndex}`);
      });
    });
    return keys.sort();
  }, [frozenPatternLines]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(freezeSoundUrl);
      audioRef.current.volume = soundVolume;
    }
    if (audioRef.current) {
      audioRef.current.volume = soundVolume;
    }
  }, [soundVolume]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(freezeSoundUrl);
    }

    const previousKeys = previousFrozenKeysRef.current;
    const hasNewFrozenLine = frozenKeys.some((key) => !previousKeys.includes(key));

    if (hasNewFrozenLine && audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise) {
        void playPromise.catch(() => {});
      }
    }

    previousFrozenKeysRef.current = frozenKeys;
  }, [frozenKeys]);
}
