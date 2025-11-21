/**
 * useVoidEffectSound - plays banish audio when the Void effect destroys a rune.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { Rune, Runeforge } from '../types/game';
import banishSoundUrl from '../assets/sounds/banish.mp3';

export function useVoidEffectSound(
  voidEffectPending: boolean,
  runeforges: Runeforge[],
  centerPool: Rune[]
): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousPendingRef = useRef(false);
  const pendingPoolCountRef = useRef<number | null>(null);

  const availableRuneCount = useMemo(
    () => runeforges.reduce((total, forge) => total + forge.runes.length, centerPool.length),
    [runeforges, centerPool.length]
  );

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }
    if (!audioRef.current) {
      audioRef.current = new Audio(banishSoundUrl);
    }
  }, []);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return;
    }

    if (voidEffectPending) {
      pendingPoolCountRef.current = availableRuneCount;
    } else if (previousPendingRef.current) {
      const previousCount = pendingPoolCountRef.current;
      if (previousCount !== null && availableRuneCount < previousCount) {
        const audioElement = audioRef.current ?? new Audio(banishSoundUrl);
        audioRef.current = audioElement;
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();
        if (playPromise) {
          void playPromise.catch(() => {});
        }
      }
    }

    previousPendingRef.current = voidEffectPending;
  }, [availableRuneCount, voidEffectPending]);
}
