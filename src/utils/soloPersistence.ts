/**
 * Solo persistence helpers - manages saving and loading solo runs.
 */

import type { GameState } from '../types/game';

const SOLO_STATE_KEY = 'necromancer-solo-state';
const SOLO_BEST_ROUND_KEY = 'necromancer-solo-best-round';
export const SOLO_STATE_VERSION = 9;

interface SoloStatePayload {
  version: typeof SOLO_STATE_VERSION;
  state: GameState;
}

const canAccessStorage = (): boolean => typeof window !== 'undefined';

function isSoloStatePayload(value: unknown): value is SoloStatePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SoloStatePayload>;
  if (candidate.version !== SOLO_STATE_VERSION || !candidate.state) {
    return false;
  }

  const state = candidate.state as Partial<GameState> & Record<string, unknown>;
  return Array.isArray(state.hand)
    && Array.isArray(state.discardPile)
    && Array.isArray(state.suppressedRunes)
    && Array.isArray(state.wallCharges)
    && typeof state.enemyMaxHealth === 'number';
}

export function saveSoloState(state: GameState): void {
  if (!canAccessStorage()) return;
  try {
    const payload: SoloStatePayload = {
      version: SOLO_STATE_VERSION,
      state,
    };
    window.localStorage.setItem(SOLO_STATE_KEY, JSON.stringify(payload));
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
    const parsedState = JSON.parse(rawState) as unknown;
    if (!isSoloStatePayload(parsedState)) {
      clearSoloState();
      return null;
    }
    return parsedState.state;
  } catch (error) {
    console.error('Failed to parse saved solo state', error);
    clearSoloState();
    return null;
  }
}

export function hasSavedSoloState(): boolean {
  if (!canAccessStorage()) return false;
  return loadSoloState() !== null;
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

export function updateLongestSoloRun(game: number): number {
  if (!canAccessStorage()) return 0;
  const sanitizedGame = Math.max(0, Math.floor(game));
  const currentBest = getLongestSoloRun();
  const nextBest = Math.max(currentBest, sanitizedGame);

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
