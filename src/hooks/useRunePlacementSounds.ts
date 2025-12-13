/**
 * useRunePlacementSounds - plays elemental rune audio when runes begin animating toward their destinations (pattern lines, floor, or center) with placement fallback detection.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { AnimatingRune, Player, RuneType } from '../types/game';
import fireRuneSound from '../assets/sounds/fire.mp3';
import frostRuneSound from '../assets/sounds/frost.mp3';
import lifeRuneSound from '../assets/sounds/life.mp3';
import voidRuneSound from '../assets/sounds/void.mp3';
import windRuneSound from '../assets/sounds/wind.mp3';
import damageSoundUrl from '../assets/sounds/damage.mp3';
import lightningSoundUrl from '../assets/sounds/lightning.mp3';

type RuneSoundMap = Record<RuneType, string>;
type RuneCountMap = Record<RuneType, number>;

const SOUND_SOURCES: RuneSoundMap = {
  Fire: fireRuneSound,
  Frost: frostRuneSound,
  Life: lifeRuneSound,
  Void: voidRuneSound,
  Wind: windRuneSound,
  Lightning: fireRuneSound
};
//TODO: USE SINGLE PLAYER
const createEmptyCountMap = (initialValue: number): RuneCountMap => ({
  Fire: initialValue,
  Frost: initialValue,
  Life: initialValue,
  Void: initialValue,
  Wind: initialValue,
  Lightning: initialValue
});

const countRunePlacements = (players: Player[]): RuneCountMap =>
  players.reduce((totals, player) => {
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
      Fire: totals.Fire + patternTotals.Fire + floorTotals.Fire,
      Frost: totals.Frost + patternTotals.Frost + floorTotals.Frost,
      Life: totals.Life + patternTotals.Life + floorTotals.Life,
      Void: totals.Void + patternTotals.Void + floorTotals.Void,
      Wind: totals.Wind + patternTotals.Wind + floorTotals.Wind,
      Lightning: totals.Lightning + patternTotals.Lightning + floorTotals.Lightning
    };
  }, createEmptyCountMap(0));

export function useRunePlacementSounds(
  players: Player[],
  animatingRunes: AnimatingRune[],
  soundVolume: number,
  overloadSoundPending: boolean,
  clearOverloadSound: () => void,
  channelSoundPending: boolean,
  clearChannelSound: () => void
) {
  const placementsByType = useMemo(() => countRunePlacements(players), [players]);
  const previousCountsRef = useRef<RuneCountMap>(placementsByType);
  const audioRefs = useRef<Record<RuneType, HTMLAudioElement | null>>({
    Fire: null,
    Frost: null,
    Life: null,
    Void: null,
    Wind: null,
    Lightning: null
  });
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

    (Object.keys(SOUND_SOURCES) as RuneType[]).forEach((runeType) => {
      if (!audioRefs.current[runeType]) {
        audioRefs.current[runeType] = new Audio(SOUND_SOURCES[runeType]);
      }
      const audio = audioRefs.current[runeType];
      if (audio) {
        audio.volume = soundVolume;
      }
    });
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

  const playSound = useRef((runeType: RuneType) => {
    const audioElement = audioRefs.current[runeType];
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
