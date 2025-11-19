/**
 * Custom hook for game actions
 * Provides convenient access to game state mutations
 */

import { useGameplayStore } from '../state/stores/gameplayStore';

export function useGameActions() {
  const draftRune = useGameplayStore((state) => state.draftRune);
  const draftFromCenter = useGameplayStore((state) => state.draftFromCenter);
  const placeRunes = useGameplayStore((state) => state.placeRunes);
  const placeRunesInFloor = useGameplayStore((state) => state.placeRunesInFloor);
  const cancelSelection = useGameplayStore((state) => state.cancelSelection);
  const skipVoidEffect = useGameplayStore((state) => state.skipVoidEffect);
  const endRound = useGameplayStore((state) => state.endRound);
  const resetGame = useGameplayStore((state) => state.resetGame);
  
  return {
    draftRune,
    draftFromCenter,
    placeRunes,
    placeRunesInFloor,
    cancelSelection,
    skipVoidEffect,
    endRound,
    resetGame,
  };
}
