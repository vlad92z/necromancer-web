/**
 * Gameplay Actions - stable orchestration entry points for current combat.
 */

import type { GameState, MapTravelTarget } from '../../types/game';
import { useGameplayStore } from './gameplayStore';

export interface GameplayActions {
  startSoloRun: () => void;
  prepareSoloMode: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  returnToMapAfterReward: () => void;
  revealMapRoadTarget: (target: Extract<MapTravelTarget, { kind: 'road' }>) => Extract<MapTravelTarget, { kind: 'location' }> | null;
  travelToMapTarget: (target: MapTravelTarget) => void;
  selectHandRune: (runeId: string) => void;
  castRuneToWall: (row: number, col: number) => void;
  selectPendingRuneTarget: (side: 'player' | 'enemy', row: number, col: number) => void;
  skipPendingRuneTarget: () => void;
  endCombatTurn: () => void;
  resetGame: () => void;
  selectDeckDraftOffer: (offerId: string) => void;
}

export const gameplayActions: GameplayActions = {
  startSoloRun: () => useGameplayStore.getState().startSoloRun(),
  prepareSoloMode: () => useGameplayStore.getState().prepareSoloMode(),
  hydrateGameState: (nextState) => useGameplayStore.getState().hydrateGameState(nextState),
  returnToStartScreen: () => useGameplayStore.getState().returnToStartScreen(),
  returnToMapAfterReward: () => useGameplayStore.getState().returnToMapAfterReward(),
  revealMapRoadTarget: (target) => useGameplayStore.getState().revealMapRoadTarget(target),
  travelToMapTarget: (target) => useGameplayStore.getState().travelToMapTarget(target),
  selectHandRune: (runeId) => useGameplayStore.getState().selectHandRune(runeId),
  castRuneToWall: (row, col) => useGameplayStore.getState().castRuneToWall(row, col),
  selectPendingRuneTarget: (side, row, col) => useGameplayStore.getState().selectPendingRuneTarget(side, row, col),
  skipPendingRuneTarget: () => useGameplayStore.getState().skipPendingRuneTarget(),
  endCombatTurn: () => useGameplayStore.getState().endCombatTurn(),
  resetGame: () => useGameplayStore.getState().resetGame(),
  selectDeckDraftOffer: (offerId) => useGameplayStore.getState().selectDeckDraftOffer(offerId),
};
