/**
 * useRuneSound - returns a callback to play a spell's canonical audio cue.
 */
import { useCallback, useRef } from 'react';
import { useSoundVolume } from './useGameState';

export function useRuneSound(): (soundUrl: string) => void {
  const soundVolume = useSoundVolume();
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  return useCallback((soundUrl: string) => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRefs.current[soundUrl]) {
      audioRefs.current[soundUrl] = new Audio(soundUrl);
    }

    const baseAudioElement = audioRefs.current[soundUrl];
    if (!baseAudioElement) {
      return;
    }

    const audioElement = baseAudioElement.cloneNode(true) as HTMLAudioElement;
    audioElement.volume = soundVolume;
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();
    if (playPromise) {
      void playPromise.catch(() => {});
    }
  }, [soundVolume]);
}
