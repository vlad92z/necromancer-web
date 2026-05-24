/**
 * Gameplay Actions - stable orchestration entry points for current combat.
 */

import type { GameState } from '../../types/game';
import { useGameplayStore } from './gameplayStore';

export interface GameplayActions {
  startSoloRun: () => void;
  prepareSoloMode: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  startNextSoloGame: () => void;
  selectHandRune: (runeId: string) => void;
  castRuneToWall: (row: number, col: number) => void;
  endCombatTurn: () => void;
  resetGame: () => void;
  selectDeckDraftOffer: (offerId: string) => void;
  disenchantRuneFromDeck: (runeId: string) => number;
}

export const gameplayActions: GameplayActions = {
  startSoloRun: () => useGameplayStore.getState().startSoloRun(),
  prepareSoloMode: () => useGameplayStore.getState().prepareSoloMode(),
  hydrateGameState: (nextState) => useGameplayStore.getState().hydrateGameState(nextState),
  returnToStartScreen: () => useGameplayStore.getState().returnToStartScreen(),
  startNextSoloGame: () => useGameplayStore.getState().startNextSoloGame(),
  selectHandRune: (runeId) => useGameplayStore.getState().selectHandRune(runeId),
  castRuneToWall: (row, col) => useGameplayStore.getState().castRuneToWall(row, col),
  endCombatTurn: () => useGameplayStore.getState().endCombatTurn(),
  resetGame: () => useGameplayStore.getState().resetGame(),
  selectDeckDraftOffer: (offerId) => useGameplayStore.getState().selectDeckDraftOffer(offerId),
  disenchantRuneFromDeck: (runeId) => useGameplayStore.getState().disenchantRuneFromDeck(runeId),
};
