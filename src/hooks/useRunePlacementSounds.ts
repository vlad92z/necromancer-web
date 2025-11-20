/**
 * useRunePlacementSounds - plays elemental rune audio when runes begin animating toward pattern lines or the floor (with placement fallback).
 */
import { useEffect, useMemo, useRef } from 'react';
import type { AnimatingRune, Player, RuneType } from '../types/game';
import fireRuneSound from '../assets/sounds/fire.wav';
import frostRuneSound from '../assets/sounds/frost.wav';
import lifeRuneSound from '../assets/sounds/life.wav';
import voidRuneSound from '../assets/sounds/void.wav';
import windRuneSound from '../assets/sounds/wind.wav';

type RuneSoundMap = Record<RuneType, string>;
type RuneCountMap = Record<RuneType, number>;

const SOUND_SOURCES: RuneSoundMap = {
  Fire: fireRuneSound,
  Frost: frostRuneSound,
  Life: lifeRuneSound,
  Void: voidRuneSound,
  Wind: windRuneSound
};

const createEmptyCountMap = (initialValue: number): RuneCountMap => ({
  Fire: initialValue,
  Frost: initialValue,
  Life: initialValue,
  Void: initialValue,
  Wind: initialValue
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
      Wind: totals.Wind + patternTotals.Wind + floorTotals.Wind
    };
  }, createEmptyCountMap(0));

export function useRunePlacementSounds(players: Player[], animatingRunes: AnimatingRune[]) {
  const placementsByType = useMemo(() => countRunePlacements(players), [players]);
  const previousCountsRef = useRef<RuneCountMap>(placementsByType);
  const audioRefs = useRef<Record<RuneType, HTMLAudioElement | null>>({
    Fire: null,
    Frost: null,
    Life: null,
    Void: null,
    Wind: null
  });
  const previousAnimationKeysRef = useRef<Record<RuneType, string>>({
    Fire: '',
    Frost: '',
    Life: '',
    Void: '',
    Wind: ''
  });

  const animationKeys = useMemo(() => {
    const idsByType: Record<RuneType, string[]> = {
      Fire: [],
      Frost: [],
      Life: [],
      Void: [],
      Wind: []
    };

    animatingRunes.forEach((rune) => {
      idsByType[rune.runeType].push(rune.id);
    });

    return {
      Fire: idsByType.Fire.length ? idsByType.Fire.sort().join('|') : '',
      Frost: idsByType.Frost.length ? idsByType.Frost.sort().join('|') : '',
      Life: idsByType.Life.length ? idsByType.Life.sort().join('|') : '',
      Void: idsByType.Void.length ? idsByType.Void.sort().join('|') : '',
      Wind: idsByType.Wind.length ? idsByType.Wind.sort().join('|') : ''
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
    });
  }, []);

  const playSound = (runeType: RuneType) => {
    const audioElement = audioRefs.current[runeType];
    if (audioElement) {
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      if (playPromise) {
        void playPromise.catch(() => {});
      }
    }
  };

  useEffect(() => {
    (Object.keys(animationKeys) as RuneType[]).forEach((runeType) => {
      const currentKey = animationKeys[runeType];
      const previousKey = previousAnimationKeysRef.current[runeType];
      if (currentKey && currentKey !== previousKey) {
        playSound(runeType);
        previousAnimationKeysRef.current[runeType] = currentKey;
      } else if (!currentKey) {
        previousAnimationKeysRef.current[runeType] = '';
      }
    });
  }, [animationKeys]);

  useEffect(() => {
    (Object.keys(placementsByType) as RuneType[]).forEach((runeType) => {
      const currentCount = placementsByType[runeType];
      const previousCount = previousCountsRef.current[runeType];
      if (currentCount > previousCount) {
        playSound(runeType);
      }
      previousCountsRef.current[runeType] = currentCount;
    });
  }, [placementsByType]);
}
