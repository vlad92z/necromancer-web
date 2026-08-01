/**
 * Solo persistence helpers - manages saving and loading solo runs.
 */

import type { GameState, SoloMapState } from '../types/game';

const SOLO_STATE_KEY = 'necromancer-solo-state';
const SOLO_BEST_ROUND_KEY = 'necromancer-solo-best-round';
export const SOLO_STATE_VERSION = 29;

interface SoloStatePayload {
  version: typeof SOLO_STATE_VERSION;
  state: GameState;
}

const canAccessStorage = (): boolean => typeof window !== 'undefined';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSoloMapState(value: unknown): value is SoloMapState {
  if (!isRecord(value) || !isRecord(value.tiles) || !isRecord(value.playerPosition)
    || value.regionId !== 'greenwood' || !Array.isArray(value.availableEventTokenIds)) {
    return false;
  }

  const { tileKey, locationId } = value.playerPosition;
  if (
    typeof tileKey !== 'string'
    || !['start', 'A', 'B', 'C', 'D'].includes(String(locationId))
    || !isRecord(value.tiles[tileKey])
  ) {
    return false;
  }

  return Object.entries(value.tiles).every(([key, tileValue]) => {
    if (!isRecord(tileValue) || !isRecord(tileValue.events)) {
      return false;
    }

    const events = Object.values(tileValue.events);
    return tileValue.key === key
      && typeof tileValue.x === 'number'
      && typeof tileValue.y === 'number'
      && (tileValue.kind === 'start' || tileValue.kind === 'forest')
      && events.every((event) => event === null || (
        isRecord(event)
        && (typeof event.tokenId === 'string' || event.tokenId === null)
        && ['combat', 'boss', 'healing', 'empty'].includes(String(event.kind))
        && (event.monsterId === undefined || ['goblin', 'golem-lord'].includes(String(event.monsterId)))
        && (event.kind !== 'boss' || event.monsterId === 'golem-lord')
        && typeof event.cleared === 'boolean'
      ));
  });
}

function isPosition(value: unknown): boolean {
  return isRecord(value) && Number.isInteger(value.row) && Number.isInteger(value.col);
}

function isPendingCombatResolution(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value) || !isRecord(value.target) || !isRecord(value.continuation)) return false;
  const effectRef = value.target.effectRef;
  if (
    !isRecord(effectRef)
    || !['rune.consume', 'rune.destroy'].includes(String(effectRef.effectId))
    || !['manual', 'random'].includes(String(effectRef.selection))
    || !['onCast', 'onIncomingDamage', 'startTurn', 'endTurn'].includes(String(effectRef.trigger))
    || !isPosition(value.target.sourcePosition)
  ) return false;
  const kind = value.continuation.kind;
  if (kind === 'cast') {
    return isRecord(value.continuation.castRune)
      && isPosition(value.continuation.sourcePosition)
      && Array.isArray(value.continuation.remainingEffectRefs);
  }
  return (kind === 'startTurn' || kind === 'endTurn')
    && Array.isArray(value.continuation.processedRemovalKeys);
}

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
    && Array.isArray(state.enemyBoard)
    && Array.isArray(state.enemyQueuedRunes)
    && isPendingCombatResolution(state.pendingCombatResolution)
    && typeof state.enemyMaxHealth === 'number'
    && typeof state.arcaneDust === 'number'
    && typeof state.isVictory === 'boolean'
    && isRecord(state.player)
    && typeof state.player.mana === 'number'
    && typeof state.player.maxMana === 'number'
    && ['map', 'encounter', 'reward'].includes(String(state.soloPhase))
    && isSoloMapState(state.soloMap);
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
