/**
 * Run Store - solo run lifecycle and progression state.
 */

import { create, type StoreApi } from 'zustand';
import type { ArtefactId } from '../../types/artefacts';
import type { DeckDraftState, GameState, Rune, RuneSoundSignals, SoloPhase, SpellAnimationEvent } from '../../types/game';
import { createInitialSoloRunState } from '../../utils/soloRunFactory';

export interface RunState {
  gameStarted: boolean;
  soloPhase: SoloPhase;
  startingHealth: number;
  fullDeck: Rune[];
  gameIndex: number;
  arcaneDust: number;
  isDefeat: boolean;
  isVictory: boolean;
  longestRun: number;
  deckDraftState: DeckDraftState | null;
  activeArtefacts: ArtefactId[];
  runeSoundSignals: RuneSoundSignals;
  spellAnimationEvent: SpellAnimationEvent | null;
  enemyAttackSoundSignal: number;
  shieldSoundSignal: number;
}

export interface RunStore extends RunState {
  replaceRunState: (next: RunState) => void;
}

export function pickRunState(state: GameState): RunState {
  return {
    gameStarted: state.gameStarted,
    soloPhase: state.soloPhase,
    startingHealth: state.startingHealth,
    fullDeck: state.fullDeck,
    gameIndex: state.gameIndex,
    arcaneDust: state.arcaneDust,
    isDefeat: state.isDefeat,
    isVictory: state.isVictory,
    longestRun: state.longestRun,
    deckDraftState: state.deckDraftState,
    activeArtefacts: state.activeArtefacts,
    runeSoundSignals: state.runeSoundSignals,
    spellAnimationEvent: state.spellAnimationEvent,
    enemyAttackSoundSignal: state.enemyAttackSoundSignal,
    shieldSoundSignal: state.shieldSoundSignal,
  };
}

export function createRunStore(initialState: RunState = pickRunState(createInitialSoloRunState())) {
  return create<RunStore>((set) => ({
    ...initialState,
    replaceRunState: (next) => set(() => next),
  }));
}

export const useRunStore = createRunStore();

export type RunStoreApi = StoreApi<RunStore>;
