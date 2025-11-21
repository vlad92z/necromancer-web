/**
 * useClickSound - returns a reusable click sound trigger for UI interactions.
 */
import { useCallback, useEffect, useRef } from 'react';
import clickSoundUrl from '../assets/sounds/click.mp3';

export function useClickSound(): () => void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(clickSoundUrl);
    }
  }, []);

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

    audioElement.currentTime = 0;
    const playPromise = audioElement.play();
    if (playPromise) {
      void playPromise.catch(() => {});
    }
  }, []);
}
