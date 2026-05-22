/**
 * Run Store - solo run lifecycle, progression, and configuration state.
 */

import { create, type StoreApi } from 'zustand';
import type { ArtefactId } from '../../types/artefacts';
import type { DeckDraftState, GameState, Rune } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface RunState {
  gameStarted: boolean;
  runesPerRuneforge: number;
  startingHealth: number;
  overflowCapacity: number;
  fullDeck: Rune[];
  gameIndex: number;
  round: number;
  runePowerTotal: number;
  targetScore: number;
  isDefeat: boolean;
  patternLineLock: boolean;
  longestRun: number;
  deckDraftState: DeckDraftState | null;
  baseTargetScore: number;
  deckDraftReadyForNextGame: boolean;
  activeArtefacts: ArtefactId[];
}

export interface RunStore extends RunState {
  replaceRunState: (next: RunState) => void;
}

export function pickRunState(state: GameState): RunState {
  return {
    gameStarted: state.gameStarted,
    runesPerRuneforge: state.runesPerRuneforge,
    startingHealth: state.startingHealth,
    overflowCapacity: state.overflowCapacity,
    fullDeck: state.fullDeck,
    gameIndex: state.gameIndex,
    round: state.round,
    runePowerTotal: state.runePowerTotal,
    targetScore: state.targetScore,
    isDefeat: state.isDefeat,
    patternLineLock: state.patternLineLock,
    longestRun: state.longestRun,
    deckDraftState: state.deckDraftState,
    baseTargetScore: state.baseTargetScore,
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
