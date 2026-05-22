/**
 * Gameplay Actions - orchestration entry points for gameplay flows.
 *
 * The action surface is intentionally separate from read stores so components
 * can depend on stable hooks while gameplay state is split by concern.
 */

import type { GameState, RuneType } from '../../types/game';
import { useGameplayStore } from './gameplayStore';

export interface GameplayActions {
  startSoloRun: () => void;
  prepareSoloMode: () => void;
  hydrateGameState: (nextState: GameState) => void;
  returnToStartScreen: () => void;
  startNextSoloGame: () => void;
  draftRune: (runeforgeId: string, runeType: RuneType, primaryRuneId: string) => void;
  placeRunes: (patternLineIndex: number) => void;
  moveRunesToWall: () => void;
  placeRunesInFloor: () => void;
  cancelSelection: () => void;
  autoPlaceSelection: () => void;
  acknowledgeOverloadSound: () => void;
  acknowledgeChannelSound: () => void;
  endRound: () => void;
  resetGame: () => void;
  selectDeckDraftRuneforge: (runeforgeId: string) => void;
  disenchantRuneFromDeck: (runeId: string) => number;
}

export const gameplayActions: GameplayActions = {
  startSoloRun: () => useGameplayStore.getState().startSoloRun(),
  prepareSoloMode: () => useGameplayStore.getState().prepareSoloMode(),
  hydrateGameState: (nextState) => useGameplayStore.getState().hydrateGameState(nextState),
  returnToStartScreen: () => useGameplayStore.getState().returnToStartScreen(),
  startNextSoloGame: () => useGameplayStore.getState().startNextSoloGame(),
  draftRune: (runeforgeId, runeType, primaryRuneId) =>
    useGameplayStore.getState().draftRune(runeforgeId, runeType, primaryRuneId),
  placeRunes: (patternLineIndex) => useGameplayStore.getState().placeRunes(patternLineIndex),
  moveRunesToWall: () => useGameplayStore.getState().moveRunesToWall(),
  placeRunesInFloor: () => useGameplayStore.getState().placeRunesInFloor(),
  cancelSelection: () => useGameplayStore.getState().cancelSelection(),
  autoPlaceSelection: () => useGameplayStore.getState().autoPlaceSelection(),
  acknowledgeOverloadSound: () => useGameplayStore.getState().acknowledgeOverloadSound(),
  acknowledgeChannelSound: () => useGameplayStore.getState().acknowledgeChannelSound(),
  endRound: () => useGameplayStore.getState().endRound(),
  resetGame: () => useGameplayStore.getState().resetGame(),
  selectDeckDraftRuneforge: (runeforgeId) => useGameplayStore.getState().selectDeckDraftRuneforge(runeforgeId),
  disenchantRuneFromDeck: (runeId) => useGameplayStore.getState().disenchantRuneFromDeck(runeId),
};
