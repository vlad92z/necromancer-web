/**
 * AI Controller - Orchestrates AI turns and effect handling
 * Separates AI logic from App.tsx component
 * All timing is handled by component useEffect hooks
 */

import { getAIPlayerProfile } from '../utils/aiPlayer';
import type { StoreApi } from 'zustand';
import { useGameplayStore } from '../state/stores/gameplayStore';
import type { GameplayStore } from '../state/stores/gameplayStore';

/**
 * Execute an AI turn (draft + placement)
 * Pure function - no setTimeout, timing handled by caller
 * Returns true if a move was made
 */
export function executeAITurn(store: StoreApi<GameplayStore> = useGameplayStore): boolean {
  const state = store.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Only execute if it's AI's turn and in draft phase
  if (currentPlayer.type !== 'ai' || state.turnPhase !== 'draft') {
    return false;
  }
  
  // Get per-player difficulty if available, otherwise use global difficulty
  const aiDifficulty = state.aiDifficulties?.[currentPlayer.id] ?? state.aiDifficulty;
  const aiProfile = getAIPlayerProfile(aiDifficulty);
  const moveMade = aiProfile.makeMove(
    state,
    state.draftRune,
    state.draftFromCenter,
    state.placeRunes,
    state.placeRunesInFloor
  );
  
  return moveMade;
}

/**
 * Check if AI needs to make a placement after drafting
 * Returns true if AI has selected runes and needs to place them
 */
export function needsAIPlacement(store: StoreApi<GameplayStore> = useGameplayStore): boolean {
  const state = store.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  return currentPlayer.type === 'ai' && 
         state.selectedRunes.length > 0 &&
         state.turnPhase === 'draft';
}

/**
 * Execute AI Void effect (single rune destruction)
 * Pure function - no setTimeout, timing handled by caller
 */
export function executeAIVoidEffect(store: StoreApi<GameplayStore> = useGameplayStore) {
  const state = store.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Get per-player difficulty if available, otherwise use global difficulty
  const aiDifficulty = state.aiDifficulties?.[currentPlayer.id] ?? state.aiDifficulty;
  const aiProfile = getAIPlayerProfile(aiDifficulty);
  const runeTarget = aiProfile.chooseVoidTarget(state);
  
  if (runeTarget) {
    state.destroyRune(runeTarget);
  } else {
    state.skipVoidEffect();
  }
}

/**
 * Execute AI Frost effect (pattern line freezing)
 * Pure function - no setTimeout, timing handled by caller
 */
export function executeAIFrostEffect(store: StoreApi<GameplayStore> = useGameplayStore) {
  const state = store.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Get per-player difficulty if available, otherwise use global difficulty
  const aiDifficulty = state.aiDifficulties?.[currentPlayer.id] ?? state.aiDifficulty;
  const aiProfile = getAIPlayerProfile(aiDifficulty);
  const patternLineToFreeze = aiProfile.choosePatternLineToFreeze(state);
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponentId = state.players[opponentIndex].id;
  
  if (patternLineToFreeze !== null) {
    state.freezePatternLine(opponentId, patternLineToFreeze);
  } else {
    state.skipFrostEffect();
  }
}

/**
 * Legacy exports for backward compatibility
 * @deprecated Use executeAITurn instead
 */
export const triggerAITurn = executeAITurn;

/**
 * @deprecated Use executeAIVoidEffect instead
 */
export function handleAIVoidEffect() {
  executeAIVoidEffect();
}

/**
 * @deprecated Use executeAIFrostEffect instead
 */
export function handleAIFrostEffect() {
  executeAIFrostEffect();
}
