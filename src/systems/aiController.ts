/**
 * AI Controller - Orchestrates AI turns and effect handling
 * Separates AI logic from App.tsx component
 * All timing is handled by component useEffect hooks
 */

import { getAIPlayerProfile } from '../utils/aiPlayer';
import type { StoreApi } from 'zustand';
import { useGameplayStore } from '../state/stores/gameplayStore';
import type { GameplayStore } from '../state/stores/gameplayStore';
import { getControllerForIndex } from '../utils/playerControllers';

/**
 * Execute an AI turn (draft + placement)
 * Pure function - no setTimeout, timing handled by caller
 * Returns true if a move was made
 */
export function executeAITurn(store: StoreApi<GameplayStore> = useGameplayStore): boolean {
  const state = store.getState();
  const controller = getControllerForIndex(state, state.currentPlayerIndex);
  
  // Only execute if it's AI's turn and in draft phase
  if (controller.type !== 'computer' || state.turnPhase !== 'draft') {
    return false;
  }
  
  const aiProfile = getAIPlayerProfile(controller.difficulty);
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
  const controller = getControllerForIndex(state, state.currentPlayerIndex);
  
  return controller.type === 'computer' && 
         state.selectedRunes.length > 0 &&
         state.turnPhase === 'draft';
}

/**
 * Execute AI Void effect (single rune destruction)
 * Pure function - no setTimeout, timing handled by caller
 */
export function executeAIVoidEffect(store: StoreApi<GameplayStore> = useGameplayStore) {
  const state = store.getState();
  const controller = getControllerForIndex(state, state.currentPlayerIndex);

  if (controller.type !== 'computer') {
    return;
  }
  
  const aiProfile = getAIPlayerProfile(controller.difficulty);
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
  const controller = getControllerForIndex(state, state.currentPlayerIndex);

  if (controller.type !== 'computer') {
    return;
  }
  
  const aiProfile = getAIPlayerProfile(controller.difficulty);
  // Primary chooser
  let patternLineToFreeze = aiProfile.choosePatternLineToFreeze(state);
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponentId = state.players[opponentIndex].id;

  // Fallbacks: if primary chooser returns null, try simpler/random strategies
  if (patternLineToFreeze === null) {
    // Try easy fallback (prioritize finishable lines)
    try {
      // Importing specific fallback selectors from aiPlayer via the profile might not be available,
      // so attempt a safer random selection next.
      const { choosePatternLineToFreeze: fallback } = getAIPlayerProfile('easy');
      patternLineToFreeze = fallback(state);
    } catch (e) {
      console.log(e);
      patternLineToFreeze = null;
    }
  }

  if (patternLineToFreeze === null) {
    // Last resort: pick a random available pattern line to freeze
    try {
      const { choosePatternLineToFreeze: randomFallback } = getAIPlayerProfile('hard');
      patternLineToFreeze = randomFallback(state);
    } catch (e) {
      console.log(e);
      patternLineToFreeze = null;
    }
  }

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
