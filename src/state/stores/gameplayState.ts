/**
 * Gameplay state composition helpers for split Zustand read stores.
 */

import type { GameState } from '../../types/game';
import { pickBoardState, useBoardStore } from './boardStore';
import { pickCombatState, useCombatStore } from './combatStore';
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

  return {
    gameStarted: run.gameStarted,
    startingHealth: run.startingHealth,
    player: board.player,
    fullDeck: run.fullDeck,
    gameIndex: run.gameIndex,
    enemyMaxHealth: run.enemyMaxHealth,
    enemyAttackDamage: run.enemyAttackDamage,
    baseEnemyMaxHealth: run.baseEnemyMaxHealth,
    isDefeat: run.isDefeat,
    longestRun: run.longestRun,
    deckDraftState: run.deckDraftState,
    deckDraftReadyForNextGame: run.deckDraftReadyForNextGame,
    activeArtefacts: run.activeArtefacts,
    runeSoundSignals: run.runeSoundSignals,
    enemy: combat.enemy,
    combatPhase: combat.combatPhase,
    hand: combat.hand,
    discardPile: combat.discardPile,
    suppressedRunes: combat.suppressedRunes,
    wallCharges: combat.wallCharges,
    selectedHandRuneId: combat.selectedHandRuneId,
  };
}

export function replaceGameplayState(next: GameState): void {
  isReplacingGameplayState = true;
  try {
    useRunStore.getState().replaceRunState(pickRunState(next));
    useBoardStore.getState().replaceBoardState(pickBoardState(next));
    useCombatStore.getState().replaceCombatState(pickCombatState(next));
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
  areStoreSubscriptionsAttached = true;
}

export function subscribeGameplayState(listener: (state: GameState) => void): () => void {
  attachStoreSubscriptions();
  gameplayListeners.add(listener);

  return () => {
    gameplayListeners.delete(listener);
  };
}
