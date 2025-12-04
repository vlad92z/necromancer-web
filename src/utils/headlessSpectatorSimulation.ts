/**
 * HeadlessSpectatorSimulation - runs AI vs AI matches without UI/animations
 */
import type { StoreApi } from 'zustand';
import type { AIDifficulty } from '../types/game';
import type { GameplayStore } from '../state/stores/gameplayStore';
import { createGameplayStoreInstance } from '../state/stores/gameplayStore';
import { executeAITurn, needsAIPlacement } from '../systems/aiController';
import { getControllerForIndex } from './playerControllers';

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

    if (state.shouldTriggerEndRound || state.turnPhase === 'end-of-round') {
      store.getState().endRound();
      steps++;
      continue;
    }

    if (state.turnPhase === 'cast') {
      store.getState().moveRunesToWall();
      steps++;
      continue;
    }

    if (state.turnPhase === 'game-over') {
      break;
    }

    const controller = getControllerForIndex(state, state.currentPlayerIndex);

    if (controller.type !== 'computer') {
      break;
    }

    if (needsAIPlacement(store as StoreApi<GameplayStore>)) {
      executeAITurn(store as StoreApi<GameplayStore>);
    } else if (state.turnPhase === 'draft' || state.turnPhase === 'place') {
      executeAITurn(store as StoreApi<GameplayStore>);
    } else {
      // Unexpected phase; break to avoid infinite loop
      break;
    }

    steps++;
  }

  const finalState = store.getState();
  const bottom = finalState.players[0];
  const top = finalState.players[1];

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
  games: number = 100,
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
