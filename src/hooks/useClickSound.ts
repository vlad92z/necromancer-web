/**
 * useClickSound - returns a reusable click sound trigger for UI interactions.
 */
import { useCallback, useEffect, useRef } from 'react';
import clickSoundUrl from '../assets/sounds/click.mp3';
import { useUIStore } from '../state/stores/uiStore';

export function useClickSound(): () => void {
  const soundVolume = useUIStore((state) => state.soundVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(clickSoundUrl);
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
      audioRef.current = new Audio(clickSoundUrl);
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
