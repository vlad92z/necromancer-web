/**
 * useCastSound - returns a callback to play the cast audio effect for damage events.
 */
import { useCallback, useEffect, useRef } from 'react';
import castSoundUrl from '../assets/sounds/cast.mp3';
import { useUIStore } from '../state/stores/uiStore';

export function useCastSound(): () => void {
  const soundVolume = useUIStore((state) => state.soundVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(castSoundUrl);
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
      audioRef.current = new Audio(castSoundUrl);
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
