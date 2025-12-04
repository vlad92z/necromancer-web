/**
 * Solo persistence helpers - manages saving and loading solo runs.
 */

import type { GameState } from '../types/game';

const SOLO_STATE_KEY = 'necromancer-solo-state';

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
    if (parsedState?.matchType !== 'solo') {
      return null;
    }
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
