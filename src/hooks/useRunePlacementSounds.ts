/**
 * useRunePlacementSounds - plays a single rune audio (fire) when runes begin animating toward their destinations (pattern lines, floor, or center).
 */
import { useEffect, useMemo, useRef } from 'react';
import type { AnimatingRune, RuneType } from '../types/game';
import fireRuneSound from '../assets/sounds/fire.mp3';
import damageSoundUrl from '../assets/sounds/damage.mp3';
import lightningSoundUrl from '../assets/sounds/lightning.mp3';

export function useRunePlacementSounds(
  animatingRunes: AnimatingRune[],
  soundVolume: number,
  overloadSoundPending: boolean,
  clearOverloadSound: () => void,
  channelSoundPending: boolean,
  clearChannelSound: () => void
) {
  const runeAudioRef = useRef<HTMLAudioElement | null>(null);
  const previousAnimationKeysRef = useRef<Record<RuneType, string>>({
    Fire: '',
    Frost: '',
    Life: '',
    Void: '',
    Wind: '',
    Lightning: ''
  });

  const soundVolumeRef = useRef(soundVolume);
  const damageAudioRef = useRef<HTMLAudioElement | null>(null);
  const lightningAudioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    soundVolumeRef.current = soundVolume;
  }, [soundVolume]);

  const animationKeys = useMemo(() => {
    const idsByType: Record<RuneType, string[]> = {
      Fire: [],
      Frost: [],
      Life: [],
      Void: [],
      Wind: [],
      Lightning: []
    };

    animatingRunes.forEach((rune) => {
      idsByType[rune.runeType].push(rune.id);
    });

    return {
      Fire: idsByType.Fire.length ? idsByType.Fire.sort().join('|') : '',
      Frost: idsByType.Frost.length ? idsByType.Frost.sort().join('|') : '',
      Life: idsByType.Life.length ? idsByType.Life.sort().join('|') : '',
      Void: idsByType.Void.length ? idsByType.Void.sort().join('|') : '',
      Wind: idsByType.Wind.length ? idsByType.Wind.sort().join('|') : '',
      Lightning: idsByType.Lightning.length ? idsByType.Lightning.sort().join('|') : ''
    };
  }, [animatingRunes]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (!runeAudioRef.current) {
      runeAudioRef.current = new Audio(fireRuneSound);
    }
    if (runeAudioRef.current) {
      runeAudioRef.current.volume = soundVolume;
    }
    if (!damageAudioRef.current) {
      damageAudioRef.current = new Audio(damageSoundUrl);
    }
    if (damageAudioRef.current) {
      damageAudioRef.current.volume = soundVolume;
    }
    if (!lightningAudioRef.current) {
      lightningAudioRef.current = new Audio(lightningSoundUrl);
    }
    if (lightningAudioRef.current) {
      lightningAudioRef.current.volume = soundVolume;
    }
  }, [soundVolume]);

  const playSound = useRef((_runeType: RuneType) => {
    const audioElement = runeAudioRef.current;
    if (audioElement) {
      audioElement.volume = soundVolumeRef.current;
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      if (playPromise) {
        void playPromise.catch(() => {});
      }
    }
  });

  useEffect(() => {
    (Object.keys(animationKeys) as RuneType[]).forEach((runeType) => {
      const currentKey = animationKeys[runeType];
      const previousKey = previousAnimationKeysRef.current[runeType];
      if (currentKey && currentKey !== previousKey) {
        playSound.current(runeType);
        previousAnimationKeysRef.current[runeType] = currentKey;
      } else if (!currentKey) {
        previousAnimationKeysRef.current[runeType] = '';
      }
    });
  }, [animationKeys]);

  useEffect(() => {
    if (!overloadSoundPending) {
      return;
    }

    if (typeof Audio !== 'undefined') {
      if (!damageAudioRef.current) {
        damageAudioRef.current = new Audio(damageSoundUrl);
      }
      const audioElement = damageAudioRef.current;
      if (audioElement) {
        audioElement.volume = soundVolumeRef.current;
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        if (playPromise) {
          void playPromise.catch(() => {});
        }
      }
    }

    clearOverloadSound();
  }, [clearOverloadSound, overloadSoundPending]);

  useEffect(() => {
    if (!channelSoundPending) {
      return;
    }

    if (typeof Audio !== 'undefined') {
      if (!lightningAudioRef.current) {
        lightningAudioRef.current = new Audio(lightningSoundUrl);
      }
      const audioElement = lightningAudioRef.current;
      if (audioElement) {
        audioElement.volume = soundVolumeRef.current;
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        if (playPromise) {
          void playPromise.catch(() => {});
        }
      }
    }

    clearChannelSound();
  }, [channelSoundPending, clearChannelSound]);

}
