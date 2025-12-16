/**
 * useRunePlacementSounds - plays a single rune audio (fire) for the solo player when runes begin animating toward their destinations (pattern lines, floor, or center) with placement fallback detection.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { AnimatingRune, Player, RuneType } from '../types/game';
import fireRuneSound from '../assets/sounds/fire.mp3';
import damageSoundUrl from '../assets/sounds/damage.mp3';
import lightningSoundUrl from '../assets/sounds/lightning.mp3';

type RuneCountMap = Record<RuneType, number>;

const createEmptyCountMap = (initialValue: number): RuneCountMap => ({
  Fire: initialValue,
  Frost: initialValue,
  Life: initialValue,
  Void: initialValue,
  Wind: initialValue,
  Lightning: initialValue
});

const countRunePlacements = (player: Player): RuneCountMap => {
  const patternTotals = player.patternLines.reduce((lineTotals, line) => {
    if (line.runeType) {
      lineTotals[line.runeType] += line.count;
    }
    return lineTotals;
  }, createEmptyCountMap(0));

  const floorTotals = player.floorLine.runes.reduce((floorCounts, rune) => {
    floorCounts[rune.runeType] += 1;
    return floorCounts;
  }, createEmptyCountMap(0));

  return {
    Fire: patternTotals.Fire + floorTotals.Fire,
    Frost: patternTotals.Frost + floorTotals.Frost,
    Life: patternTotals.Life + floorTotals.Life,
    Void: patternTotals.Void + floorTotals.Void,
    Wind: patternTotals.Wind + floorTotals.Wind,
    Lightning: patternTotals.Lightning + floorTotals.Lightning
  };
};

export function useRunePlacementSounds(
  player: Player,
  animatingRunes: AnimatingRune[],
  soundVolume: number,
  overloadSoundPending: boolean,
  clearOverloadSound: () => void,
  channelSoundPending: boolean,
  clearChannelSound: () => void
) {
  const placementsByType = useMemo(() => countRunePlacements(player), [player]);
  const previousCountsRef = useRef<RuneCountMap>(placementsByType);
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

  useEffect(() => {
    (Object.keys(placementsByType) as RuneType[]).forEach((runeType) => {
      const currentCount = placementsByType[runeType];
      const previousCount = previousCountsRef.current[runeType];
      if (currentCount > previousCount) {
        playSound.current(runeType);
      }
      previousCountsRef.current[runeType] = currentCount;
    });
  }, [placementsByType]);
}
