/**
 * Combat Store - enemy encounter, hand, discard, and spell-wall charge state.
 */

import { create, type StoreApi } from 'zustand';
import type { CombatPhase, Enemy, GameState, Rune, SpellWallCharge } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface CombatState {
  enemy: Enemy | null;
  combatPhase: CombatPhase;
  hand: Rune[];
  discardPile: Rune[];
  suppressedRunes: Rune[];
  wallCharges: SpellWallCharge[][];
  selectedHandRuneId: string | null;
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
    wallCharges: state.wallCharges,
    selectedHandRuneId: state.selectedHandRuneId,
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
