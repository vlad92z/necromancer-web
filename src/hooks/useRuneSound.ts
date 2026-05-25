/**
 * useRuneSound - returns a callback to play rune-specific audio cues.
 */
import { useCallback, useEffect, useRef } from 'react';
import type { RuneType } from '../types/game';
import runeFireSoundUrl from '../assets/sounds/rune_fire.mp3';
import runeFrostSoundUrl from '../assets/sounds/rune_frost.mp3';
import runeLifeSoundUrl from '../assets/sounds/rune_life.mp3';
import runeLightningSoundUrl from '../assets/sounds/rune_lightning.mp3';
import runeVoidSoundUrl from '../assets/sounds/rune_void.mp3';
import runeWindSoundUrl from '../assets/sounds/rune_wind.mp3';
import { useSoundVolume } from './useGameState';

const RUNE_SOUND_URLS: Record<RuneType, string> = {
  Fire: runeFireSoundUrl,
  Frost: runeFrostSoundUrl,
  Life: runeLifeSoundUrl,
  Lightning: runeLightningSoundUrl,
  Void: runeVoidSoundUrl,
  Wind: runeWindSoundUrl,
};

export function useRuneSound(): (runeType: RuneType) => void {
  const soundVolume = useSoundVolume();
  const audioRefs = useRef<Partial<Record<RuneType, HTMLAudioElement>>>({});

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    Object.entries(RUNE_SOUND_URLS).forEach(([runeType, soundUrl]) => {
      const typedRuneType = runeType as RuneType;
      if (!audioRefs.current[typedRuneType]) {
        audioRefs.current[typedRuneType] = new Audio(soundUrl);
      }
      const audioElement = audioRefs.current[typedRuneType];
      if (audioElement) {
        audioElement.volume = soundVolume;
      }
    });
  }, [soundVolume]);

  return useCallback((runeType: RuneType) => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!audioRefs.current[runeType]) {
      audioRefs.current[runeType] = new Audio(RUNE_SOUND_URLS[runeType]);
    }

    const baseAudioElement = audioRefs.current[runeType];
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
