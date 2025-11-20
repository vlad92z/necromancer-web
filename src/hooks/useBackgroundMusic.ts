/**
 * useBackgroundMusic - plays and manages looping background music when enabled.
 */
import { useEffect, useRef } from 'react';
import backgroundMusic from '../assets/sounds/background.mp3';

export function useBackgroundMusic(isEnabled: boolean, volume: number = 0.35): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    const audioElement = new Audio(backgroundMusic);
    audioElement.loop = true;
    audioElement.volume = volume;
    audioRef.current = audioElement;

    return () => {
      const audioElement = audioRef.current;
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    if (isEnabled) {
      const playPromise = audioElement.play();
      if (playPromise) {
        void playPromise.catch(() => {});
      }
    } else {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  }, [isEnabled]);
}
