/**
 * useArcaneDustSound - plays an audio cue when Arcane Dust is earned.
 */
import { useCallback, useEffect, useRef } from 'react';
import arcaneDustSoundUrl from '../assets/sounds/arcane_dust.mp3';
import { useUIStore } from '../state/stores/uiStore';

export function useArcaneDustSound(): () => void {
  const soundVolume = useUIStore((state) => state.soundVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(arcaneDustSoundUrl);
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
      audioRef.current = new Audio(arcaneDustSoundUrl);
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
