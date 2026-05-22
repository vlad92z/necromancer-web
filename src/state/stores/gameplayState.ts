/**
 * Gameplay state composition helpers for split Zustand stores.
 */

import type { GameState } from '../../types/game';
import { pickBoardState, useBoardStore } from './boardStore';
import { pickResolutionState, useResolutionStore } from './resolutionStore';
import { pickRunState, useRunStore } from './runStore';

const gameplayListeners = new Set<(state: GameState) => void>();
let isReplacingGameplayState = false;
let areStoreSubscriptionsAttached = false;

function notifyGameplayListeners(): void {
  const state = getGameplayState();
  gameplayListeners.forEach((listener) => {
    listener(state);
  });
}

export function getGameplayState(): GameState {
  const run = useRunStore.getState();
  const board = useBoardStore.getState();
  const resolution = useResolutionStore.getState();

  return {
    gameStarted: run.gameStarted,
    runesPerRuneforge: run.runesPerRuneforge,
    startingHealth: run.startingHealth,
    overflowCapacity: run.overflowCapacity,
    player: board.player,
    fullDeck: run.fullDeck,
    runeforges: board.runeforges,
    runeforgeDraftStage: board.runeforgeDraftStage,
    turnPhase: resolution.turnPhase,
    gameIndex: run.gameIndex,
    round: run.round,
    overloadDamage: board.overloadDamage,
    startingStrain: board.startingStrain,
    overloadRunes: board.overloadRunes,
    animatingRunes: board.animatingRunes,
    pendingPlacement: board.pendingPlacement,
    scoringSequence: resolution.scoringSequence,
    overloadSoundPending: resolution.overloadSoundPending,
    channelSoundPending: resolution.channelSoundPending,
    lockedPatternLines: board.lockedPatternLines,
    shouldTriggerEndRound: resolution.shouldTriggerEndRound,
    runePowerTotal: run.runePowerTotal,
    targetScore: run.targetScore,
    isDefeat: run.isDefeat,
    patternLineLock: run.patternLineLock,
    longestRun: run.longestRun,
    deckDraftState: run.deckDraftState,
    baseTargetScore: run.baseTargetScore,
    deckDraftReadyForNextGame: run.deckDraftReadyForNextGame,
    activeArtefacts: run.activeArtefacts,
  };
}

export function replaceGameplayState(next: GameState): void {
  isReplacingGameplayState = true;
  try {
    useRunStore.getState().replaceRunState(pickRunState(next));
    useBoardStore.getState().replaceBoardState(pickBoardState(next));
    useResolutionStore.getState().replaceResolutionState(pickResolutionState(next));
  } finally {
    isReplacingGameplayState = false;
  }
  notifyGameplayListeners();
}

function attachStoreSubscriptions(): void {
  if (areStoreSubscriptionsAttached) {
    return;
  }

  const notifyIfDirectStoreChange = () => {
    if (!isReplacingGameplayState) {
      notifyGameplayListeners();
    }
  };

  useRunStore.subscribe(notifyIfDirectStoreChange);
  useBoardStore.subscribe(notifyIfDirectStoreChange);
  useResolutionStore.subscribe(notifyIfDirectStoreChange);
  areStoreSubscriptionsAttached = true;
}

export function subscribeGameplayState(listener: (state: GameState) => void): () => void {
  attachStoreSubscriptions();
  gameplayListeners.add(listener);

  return () => {
    gameplayListeners.delete(listener);
  };
}
