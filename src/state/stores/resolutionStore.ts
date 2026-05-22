/**
 * Resolution Store - turn phase, scoring animation, and resolution trigger state.
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, ScoringSequenceState, TurnPhase } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface ResolutionState {
  turnPhase: TurnPhase;
  scoringSequence: ScoringSequenceState | null;
  overloadSoundPending: boolean;
  channelSoundPending: boolean;
  shouldTriggerEndRound: boolean;
}

export interface ResolutionStore extends ResolutionState {
  replaceResolutionState: (next: ResolutionState) => void;
}

export function pickResolutionState(state: GameState): ResolutionState {
  return {
    turnPhase: state.turnPhase,
    scoringSequence: state.scoringSequence,
    overloadSoundPending: state.overloadSoundPending,
    channelSoundPending: state.channelSoundPending,
    shouldTriggerEndRound: state.shouldTriggerEndRound,
  };
}

export function createResolutionStore(initialState: ResolutionState = pickResolutionState(initializeSoloGame())) {
  return create<ResolutionStore>((set) => ({
    ...initialState,
    replaceResolutionState: (next) => set(() => next),
  }));
}

export const useResolutionStore = createResolutionStore();

export type ResolutionStoreApi = StoreApi<ResolutionStore>;
