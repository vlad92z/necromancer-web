/**
 * Solo persistence helpers - manages saving and loading solo runs.
 */

import type { GameState } from '../types/game';

const SOLO_STATE_KEY = 'necromancer-solo-state';
const SOLO_BEST_ROUND_KEY = 'necromancer-solo-best-round';

const canAccessStorage = (): boolean => typeof window !== 'undefined';

export function saveSoloState(state: GameState): void {
  if (!canAccessStorage()) return;
  try {
    window.localStorage.setItem(SOLO_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save solo state', error);
  }
}

export function loadSoloState(): GameState | null {
  if (!canAccessStorage()) return null;
  const rawState = window.localStorage.getItem(SOLO_STATE_KEY);
  if (!rawState) {
    return null;
  }

  try {
    const parsedState = JSON.parse(rawState) as GameState;
    return parsedState;
  } catch (error) {
    console.error('Failed to parse saved solo state', error);
    return null;
  }
}

export function hasSavedSoloState(): boolean {
  if (!canAccessStorage()) return false;
  return Boolean(window.localStorage.getItem(SOLO_STATE_KEY));
}

export function clearSoloState(): void {
  if (!canAccessStorage()) return;
  try {
    window.localStorage.removeItem(SOLO_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear solo state', error);
  }
}

export function getLongestSoloRun(): number {
  if (!canAccessStorage()) return 0;
  const rawValue = window.localStorage.getItem(SOLO_BEST_ROUND_KEY);
  if (!rawValue) return 0;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function updateLongestSoloRun(chapter: number): number {
  if (!canAccessStorage()) return 0;
  const sanitizedChapter = Math.max(0, Math.floor(chapter));
  const currentBest = getLongestSoloRun();
  const nextBest = Math.max(currentBest, sanitizedChapter);

  if (nextBest === currentBest) {
    return currentBest;
  }

  try {
    window.localStorage.setItem(SOLO_BEST_ROUND_KEY, nextBest.toString());
  } catch (error) {
    console.error('Failed to save longest solo run', error);
  }

  return nextBest;
}
