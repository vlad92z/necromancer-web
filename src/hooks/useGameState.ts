/**
 * Custom hook for selecting specific parts of game state
 * Optimizes re-renders by selecting only needed state slices
 */

import { useGameplayStore } from '../state/stores/gameplayStore';
import { useSelectionStore } from '../state/stores/selectionStore';

/**
 * Get runeforges and center pool
 */
export function useFactories() {
  return useGameplayStore((state) => ({
    runeforges: state.runeforges,
  }));
}

/**
 * Get current turn phase
 */
export function useTurnPhase() {
  return useGameplayStore((state) => state.turnPhase);
}

/**
 * Get selected runes
 */
export function useSelectedRunes() {
  return useSelectionStore((state) => state.selectedRunes);
}

/**
 * Get current game number
 */
export function useGame() {
  return useGameplayStore((state) => state.game);
}
