/**
 * Custom hook for game actions
 * Provides convenient access to game state mutations
 */

import { useGameStore } from '../state/gameStore';

export function useGameActions() {
  const draftRune = useGameStore((state) => state.draftRune);
  const draftFromCenter = useGameStore((state) => state.draftFromCenter);
  const placeRunes = useGameStore((state) => state.placeRunes);
  const placeRunesInFloor = useGameStore((state) => state.placeRunesInFloor);
  const cancelSelection = useGameStore((state) => state.cancelSelection);
  const endRound = useGameStore((state) => state.endRound);
  const resetGame = useGameStore((state) => state.resetGame);
  
  return {
    draftRune,
    draftFromCenter,
    placeRunes,
    placeRunesInFloor,
    cancelSelection,
    endRound,
    resetGame,
  };
}
