/**
 * Custom hook for selecting specific parts of game state
 * Optimizes re-renders by selecting only needed state slices
 */

import { useGameStore } from '../state/gameStore';

/**
 * Get current player state
 */
export function useCurrentPlayer() {
  return useGameStore((state) => state.players[state.currentPlayerIndex]);
}

/**
 * Get opponent player state
 */
export function useOpponentPlayer() {
  return useGameStore((state) => state.players[state.currentPlayerIndex === 0 ? 1 : 0]);
}

/**
 * Get factories and center pool
 */
export function useFactories() {
  return useGameStore((state) => ({
    factories: state.factories,
    centerPool: state.centerPool,
  }));
}

/**
 * Get current turn phase
 */
export function useTurnPhase() {
  return useGameStore((state) => state.turnPhase);
}

/**
 * Get selected runes
 */
export function useSelectedRunes() {
  return useGameStore((state) => state.selectedRunes);
}

/**
 * Get current round number
 */
export function useRound() {
  return useGameStore((state) => state.round);
}
