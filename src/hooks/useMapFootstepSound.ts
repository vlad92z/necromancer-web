/**
 * useMapFootstepSound - loops the map walking cue only while the wizard travels.
 */
import { useEffect, useRef } from 'react';
import mapFootstepsSoundUrl from '../assets/sounds/map_footsteps.mp3';
import { useSoundVolume } from './useGameState';

export function useMapFootstepSound(isWalking: boolean): void {
  const soundVolume = useSoundVolume();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(mapFootstepsSoundUrl);
      audioRef.current.loop = true;
    }

    audioRef.current.volume = soundVolume;
  }, [soundVolume]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!isWalking) {
      const audioElement = audioRef.current;
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      return;
    }

    const audioElement = audioRef.current ?? new Audio(mapFootstepsSoundUrl);
    audioRef.current = audioElement;
    audioElement.loop = true;
    const playPromise = audioElement.play();
    if (playPromise) {
      void playPromise.catch(() => {});
    }

    return () => {
      audioElement.pause();
      audioElement.currentTime = 0;
    };
  }, [isWalking]);
}
