/**
 * Combat Store - enemy encounter, hand, discard, and enemy spellboard state.
 */

import { create, type StoreApi } from 'zustand';
import type { CombatPhase, Enemy, GameState, Rune } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface CombatState {
  enemy: Enemy | null;
  combatPhase: CombatPhase;
  hand: Rune[];
  discardPile: Rune[];
  suppressedRunes: Rune[];
  selectedHandRuneId: string | null;
  enemyBoard: GameState['enemyBoard'];
  enemyQueuedRunes: GameState['enemyQueuedRunes'];
  enemyTurnNumber: number;
  pendingCombatResolution: GameState['pendingCombatResolution'];
}

export interface CombatStore extends CombatState {
  replaceCombatState: (next: CombatState) => void;
}

export function pickCombatState(state: GameState): CombatState {
  return {
    enemy: state.enemy,
    combatPhase: state.combatPhase,
    hand: state.hand,
    discardPile: state.discardPile,
    suppressedRunes: state.suppressedRunes,
    selectedHandRuneId: state.selectedHandRuneId,
    enemyBoard: state.enemyBoard,
    enemyQueuedRunes: state.enemyQueuedRunes,
    enemyTurnNumber: state.enemyTurnNumber,
    pendingCombatResolution: state.pendingCombatResolution,
  };
}

export function createCombatStore(initialState: CombatState = pickCombatState(initializeSoloGame())) {
  return create<CombatStore>((set) => ({
    ...initialState,
    replaceCombatState: (next) => set(() => next),
  }));
}

export const useCombatStore = createCombatStore();

export type CombatStoreApi = StoreApi<CombatStore>;
