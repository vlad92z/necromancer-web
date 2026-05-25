/**
 * useEnemyAttackSound - returns a callback to play the enemy HP damage cue.
 */
import { useCallback, useEffect, useRef } from 'react';
import attackSoundUrl from '../assets/sounds/attack.mp3';
import { useSoundVolume } from './useGameState';

export function useEnemyAttackSound(): () => void {
  const soundVolume = useSoundVolume();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(attackSoundUrl);
    }

    if (audioRef.current) {
      audioRef.current.volume = soundVolume;
    }
  }, [soundVolume]);

  return useCallback(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(attackSoundUrl);
    }

    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    audioElement.volume = soundVolume;
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();
    if (playPromise) {
      void playPromise.catch(() => {});
    }
  }, [soundVolume]);
}
