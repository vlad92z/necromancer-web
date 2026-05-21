/**
 * Round resolution machine - owns queued scoring display and end-round timers outside React.
 */

import type { StoreApi } from 'zustand';
import type { ScoringSequenceState } from '../types/game';
import { clearScoringSequenceTimer, runScoringSequence } from './scoringSequenceRunner';

const END_ROUND_RESOLUTION_DELAY_MS = 1000;

interface RoundResolutionState {
  scoringSequence: ScoringSequenceState | null;
  shouldTriggerEndRound: boolean;
}

interface RoundResolutionActions<TState extends RoundResolutionState> {
  getState: StoreApi<TState>['getState'];
  setState: StoreApi<TState>['setState'];
  endRound: () => void;
}

const endRoundTimeoutRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };
let activeScoringSequenceId: number | null = null;
let scoringSequenceQueue: ScoringSequenceState[] = [];
let endRoundPending = false;

function clearEndRoundTimer(): void {
  if (endRoundTimeoutRef.current !== null) {
    clearTimeout(endRoundTimeoutRef.current);
    endRoundTimeoutRef.current = null;
  }
}

export function clearRoundResolutionTimers(): void {
  clearEndRoundTimer();
  clearScoringSequenceTimer();
  activeScoringSequenceId = null;
  scoringSequenceQueue = [];
  endRoundPending = false;
}

export function enqueueScoringSequence<TState extends RoundResolutionState>(
  sequence: ScoringSequenceState,
  actions: RoundResolutionActions<TState>
): void {
  clearEndRoundTimer();
  scoringSequenceQueue.push(sequence);
  startNextScoringSequence(actions);
}

export function scheduleEndRound<TState extends RoundResolutionState>(
  actions: RoundResolutionActions<TState>
): void {
  clearEndRoundTimer();
  endRoundPending = true;

  if (activeScoringSequenceId !== null || scoringSequenceQueue.length > 0 || actions.getState().scoringSequence) {
    return;
  }

  scheduleEndRoundTimer(actions);
}

function startNextScoringSequence<TState extends RoundResolutionState>(
  actions: RoundResolutionActions<TState>
): void {
  if (activeScoringSequenceId !== null || actions.getState().scoringSequence) {
    return;
  }

  const sequence = scoringSequenceQueue.shift();
  if (!sequence) {
    if (endRoundPending) {
      scheduleEndRoundTimer(actions);
    }
    return;
  }

  activeScoringSequenceId = sequence.sequenceId;
  actions.setState((state) => ({ ...state, scoringSequence: sequence }));

  runScoringSequence(sequence, actions.setState, () => {
    if (activeScoringSequenceId === sequence.sequenceId) {
      activeScoringSequenceId = null;
    }
    startNextScoringSequence(actions);
  });
}

function scheduleEndRoundTimer<TState extends RoundResolutionState>(
  actions: RoundResolutionActions<TState>
): void {
  if (!endRoundPending || endRoundTimeoutRef.current !== null) {
    return;
  }

  endRoundTimeoutRef.current = setTimeout(() => {
    endRoundTimeoutRef.current = null;
    endRoundPending = false;
    if (actions.getState().shouldTriggerEndRound) {
      actions.endRound();
    }
  }, END_ROUND_RESOLUTION_DELAY_MS);
}
