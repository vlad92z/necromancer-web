/**
 * useFrostSound - returns a callback to play the frost rune audio cue.
 */
import { useCallback, useEffect, useRef } from 'react';
import frostSoundUrl from '../assets/sounds/frost.mp3';
import { useSoundVolume } from './useGameState';

export function useFrostSound(): () => void {
  const soundVolume = useSoundVolume();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(frostSoundUrl);
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
      audioRef.current = new Audio(frostSoundUrl);
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
