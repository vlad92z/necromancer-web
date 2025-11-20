/**
 * HeadlessSpectatorSimulation - runs AI vs AI matches without UI/animations
 */
import type { StoreApi } from 'zustand';
import type { AIDifficulty } from '../types/game';
import type { GameplayStore } from '../state/stores/gameplayStore';
import { createGameplayStoreInstance } from '../state/stores/gameplayStore';
import { executeAITurn, needsAIPlacement, executeAIVoidEffect, executeAIFrostEffect } from '../systems/aiController';

const MAX_STEPS_PER_GAME = 8000;

export interface HeadlessResult {
  games: number;
  topWins: number;
  bottomWins: number;
  ties: number;
}

function runSingleHeadlessGame(
  topDifficulty: AIDifficulty,
  bottomDifficulty: AIDifficulty
): 'top' | 'bottom' | 'tie' {
  const store = createGameplayStoreInstance();
  store.getState().startSpectatorMatch(topDifficulty, bottomDifficulty);
  
  let steps = 0;
  while (store.getState().turnPhase !== 'game-over' && steps < MAX_STEPS_PER_GAME) {
    const state = store.getState();

    if (state.scoringPhase) {
      store.getState().processScoringStep();
      steps++;
      continue;
    }

    if (state.shouldTriggerEndRound) {
      store.getState().endRound();
      steps++;
      continue;
    }

    if (state.turnPhase === 'game-over') {
      break;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.type !== 'ai') {
      break;
    }

    if (state.voidEffectPending) {
      executeAIVoidEffect(store as StoreApi<GameplayStore>);
    } else if (state.frostEffectPending) {
      executeAIFrostEffect(store as StoreApi<GameplayStore>);
    } else if (needsAIPlacement(store as StoreApi<GameplayStore>)) {
      executeAITurn(store as StoreApi<GameplayStore>);
    } else if (state.turnPhase === 'draft') {
      executeAITurn(store as StoreApi<GameplayStore>);
    } else {
      // Unexpected phase; break to avoid infinite loop
      break;
    }

    steps++;
  }

  const finalState = store.getState();
  const top = finalState.players[0];
  const bottom = finalState.players[1];

  if (steps >= MAX_STEPS_PER_GAME) {
    return 'tie';
  }

  if (top.health === bottom.health) {
    return 'tie';
  }

  return top.health > bottom.health ? 'top' : 'bottom';
}

export function runHeadlessSpectatorSeries(
  topDifficulty: AIDifficulty,
  bottomDifficulty: AIDifficulty,
  games: number = 100
): HeadlessResult {
  let topWins = 0;
  let bottomWins = 0;
  let ties = 0;

  for (let i = 0; i < games; i++) {
    const outcome = runSingleHeadlessGame(topDifficulty, bottomDifficulty);
    if (outcome === 'top') {
      topWins++;
    } else if (outcome === 'bottom') {
      bottomWins++;
    } else {
      ties++;
    }
  }

  return {
    games,
    topWins,
    bottomWins,
    ties,
  };
}

export async function runHeadlessSpectatorSeriesAsync(
  topDifficulty: AIDifficulty,
  bottomDifficulty: AIDifficulty,
  games: number = 10,
  onProgress?: (completed: number) => void
): Promise<HeadlessResult> {
  let topWins = 0;
  let bottomWins = 0;
  let ties = 0;

  for (let i = 0; i < games; i++) {
    const outcome = runSingleHeadlessGame(topDifficulty, bottomDifficulty);
    if (outcome === 'top') {
      topWins++;
    } else if (outcome === 'bottom') {
      bottomWins++;
    } else {
      ties++;
    }
    if (onProgress) {
      onProgress(i + 1);
    }
    // Yield to event loop so UI can update progress bar
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return {
    games,
    topWins,
    bottomWins,
    ties,
  };
}
