/**
 * Custom hook for game actions
 * Provides convenient access to game state mutations
 */

import { useGameplayStore } from '../state/stores/gameplayStore';

export function useGameActions() {
  const draftRune = useGameplayStore((state) => state.draftRune);
  const draftFromCenter = useGameplayStore((state) => state.draftFromCenter);
  const placeRunes = useGameplayStore((state) => state.placeRunes);
  const moveRunesToWall = useGameplayStore((state) => state.moveRunesToWall);
  const placeRunesInFloor = useGameplayStore((state) => state.placeRunesInFloor);
  const cancelSelection = useGameplayStore((state) => state.cancelSelection);
  const endRound = useGameplayStore((state) => state.endRound);
  const resetGame = useGameplayStore((state) => state.resetGame);
  const startSoloRun = useGameplayStore((state) => state.startSoloRun);
  const prepareSoloMode = useGameplayStore((state) => state.prepareSoloMode);
  const selectDeckDraftRuneforge = useGameplayStore((state) => state.selectDeckDraftRuneforge);
  const disenchantRuneFromDeck = useGameplayStore((state) => state.disenchantRuneFromDeck);
  const forceSoloVictory = useGameplayStore((state) => state.forceSoloVictory);
  const startNextSoloGame = useGameplayStore((state) => state.startNextSoloGame);
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  
  return {
    draftRune,
    draftFromCenter,
    placeRunes,
    moveRunesToWall,
    placeRunesInFloor,
    cancelSelection,
    endRound,
    resetGame,
    startSoloRun,
    prepareSoloMode,
    selectDeckDraftRuneforge,
    disenchantRuneFromDeck,
    forceSoloVictory,
    startNextSoloGame,
    setTooltipCards,
    resetTooltipCards,
  };
}
