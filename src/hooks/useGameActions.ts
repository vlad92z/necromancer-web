/**
 * Custom hook for game actions
 * Provides convenient access to game state mutations
 */

import { useGameplayStore } from '../state/stores/gameplayStore';
import type { AIDifficulty } from '../types/game';

export function useGameActions() {
  const draftRune = useGameplayStore((state) => state.draftRune);
  const draftFromCenter = useGameplayStore((state) => state.draftFromCenter);
  const placeRunes = useGameplayStore((state) => state.placeRunes);
  const moveRunesToWall = useGameplayStore((state) => state.moveRunesToWall);
  const placeRunesInFloor = useGameplayStore((state) => state.placeRunesInFloor);
  const cancelSelection = useGameplayStore((state) => state.cancelSelection);
  const skipVoidEffect = useGameplayStore((state) => state.skipVoidEffect);
  const skipFrostEffect = useGameplayStore((state) => state.skipFrostEffect);
  const endRound = useGameplayStore((state) => state.endRound);
  const resetGame = useGameplayStore((state) => state.resetGame);
  const startSpectatorMatch = useGameplayStore((state) => state.startSpectatorMatch);
  const startSoloRun = useGameplayStore((state) => state.startSoloRun);
  const prepareSoloMode = useGameplayStore((state) => state.prepareSoloMode);
  const selectDeckDraftRuneforge = useGameplayStore((state) => state.selectDeckDraftRuneforge);
  const forceSoloVictory = useGameplayStore((state) => state.forceSoloVictory);
  
  return {
    draftRune,
    draftFromCenter,
    placeRunes,
    moveRunesToWall,
    placeRunesInFloor,
    cancelSelection,
    skipVoidEffect,
    skipFrostEffect,
    endRound,
    resetGame,
    startSpectatorMatch,
    startSoloRun,
    prepareSoloMode,
    selectDeckDraftRuneforge,
    forceSoloVictory,
  };
}

/**
 * Hook wrapper for starting a spectator match
 */
export function useSpectatorActions() {
  const startSpectatorMatch = useGameplayStore((state) => state.startSpectatorMatch);
  
  return {
    startSpectatorMatch: (topDifficulty: AIDifficulty, bottomDifficulty: AIDifficulty) => {
      startSpectatorMatch(topDifficulty, bottomDifficulty);
    },
  };
}
