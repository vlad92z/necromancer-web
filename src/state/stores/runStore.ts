/**
 * Run Store - solo run lifecycle and progression state.
 */

import { create, type StoreApi } from 'zustand';
import type { ArtefactId } from '../../types/artefacts';
import type { DeckDraftState, GameState, Rune } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface RunState {
  gameStarted: boolean;
  startingHealth: number;
  fullDeck: Rune[];
  gameIndex: number;
  enemyMaxHealth: number;
  enemyAttackDamage: number;
  baseEnemyMaxHealth: number;
  isDefeat: boolean;
  longestRun: number;
  deckDraftState: DeckDraftState | null;
  deckDraftReadyForNextGame: boolean;
  activeArtefacts: ArtefactId[];
}

export interface RunStore extends RunState {
  replaceRunState: (next: RunState) => void;
}

export function pickRunState(state: GameState): RunState {
  return {
    gameStarted: state.gameStarted,
    startingHealth: state.startingHealth,
    fullDeck: state.fullDeck,
    gameIndex: state.gameIndex,
    enemyMaxHealth: state.enemyMaxHealth,
    enemyAttackDamage: state.enemyAttackDamage,
    baseEnemyMaxHealth: state.baseEnemyMaxHealth,
    isDefeat: state.isDefeat,
    longestRun: state.longestRun,
    deckDraftState: state.deckDraftState,
    deckDraftReadyForNextGame: state.deckDraftReadyForNextGame,
    activeArtefacts: state.activeArtefacts,
  };
}

export function createRunStore(initialState: RunState = pickRunState(initializeSoloGame())) {
  return create<RunStore>((set) => ({
    ...initialState,
    replaceRunState: (next) => set(() => next),
  }));
}

export const useRunStore = createRunStore();

export type RunStoreApi = StoreApi<RunStore>;
