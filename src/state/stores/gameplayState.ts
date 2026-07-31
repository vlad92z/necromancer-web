/**
 * Gameplay state composition helpers for split Zustand read stores.
 */

import type { GameState } from '../../types/game';
import { pickBoardState, useBoardStore } from './boardStore';
import { pickCombatState, useCombatStore } from './combatStore';
import { pickMapState, useMapStore } from './mapStore';
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
  const combat = useCombatStore.getState();
  const map = useMapStore.getState();

  return {
    gameStarted: run.gameStarted,
    soloPhase: run.soloPhase,
    soloMap: map.soloMap,
    startingHealth: run.startingHealth,
    player: board.player,
    fullDeck: run.fullDeck,
    gameIndex: run.gameIndex,
    enemyMaxHealth: run.enemyMaxHealth,
    baseEnemyMaxHealth: run.baseEnemyMaxHealth,
    isDefeat: run.isDefeat,
    longestRun: run.longestRun,
    deckDraftState: run.deckDraftState,
    deckDraftReadyForNextGame: run.deckDraftReadyForNextGame,
    activeArtefacts: run.activeArtefacts,
    runeSoundSignals: run.runeSoundSignals,
    enemyAttackSoundSignal: run.enemyAttackSoundSignal,
    shieldSoundSignal: run.shieldSoundSignal,
    enemy: combat.enemy,
    combatPhase: combat.combatPhase,
    hand: combat.hand,
    discardPile: combat.discardPile,
    suppressedRunes: combat.suppressedRunes,
    selectedHandRuneId: combat.selectedHandRuneId,
    enemyBoard: combat.enemyBoard,
    enemyQueuedRunes: combat.enemyQueuedRunes,
    enemyTurnNumber: combat.enemyTurnNumber,
  };
}

export function replaceGameplayState(next: GameState): void {
  isReplacingGameplayState = true;
  try {
    useRunStore.getState().replaceRunState(pickRunState(next));
    useBoardStore.getState().replaceBoardState(pickBoardState(next));
    useCombatStore.getState().replaceCombatState(pickCombatState(next));
    useMapStore.getState().replaceMapState(pickMapState(next));
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
  useCombatStore.subscribe(notifyIfDirectStoreChange);
  useMapStore.subscribe(notifyIfDirectStoreChange);
  areStoreSubscriptionsAttached = true;
}

export function subscribeGameplayState(listener: (state: GameState) => void): () => void {
  attachStoreSubscriptions();
  gameplayListeners.add(listener);

  return () => {
    gameplayListeners.delete(listener);
  };
}
