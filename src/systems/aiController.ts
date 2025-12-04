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
  console.log(
    `AI turn start (${controller.type}.${aiProfile.id}): runeforges=${state.runeforges
      .map((forge) => forge.runes.length)
      .join(',')}, center=${state.centerPool.length}`
  )
  let moveMade = aiProfile.makeMove(
    state,
    state.draftRune,
    state.draftFromCenter,
    state.placeRunes,
    state.placeRunesInFloor
  );

  if (!moveMade) {
    const weakProfile = getAIPlayerProfile('hard');
    if (weakProfile !== aiProfile) {
      console.log(`AI fallback: invoking weak profile (${weakProfile.id})`);
      moveMade = weakProfile.makeMove(
        state,
        state.draftRune,
        state.draftFromCenter,
        state.placeRunes,
        state.placeRunesInFloor
      );
    }
  }

  if (!moveMade && state.selectedRunes.length > 0) {
    console.log('AI forced floor placement to unblock', {
      runeCount: state.selectedRunes.length,
      currentPlayerId: state.players[state.currentPlayerIndex].id,
    });
    state.placeRunesInFloor();
    moveMade = true;
  }

  if (
    !moveMade &&
    state.turnPhase === 'draft' &&
    state.selectedRunes.length === 0
  ) {
    const hasDraftableRunes =
      state.runeforges.some((forge) => forge.runes.length > 0) ||
      state.centerPool.length > 0;
    if (!hasDraftableRunes) {
      console.log('AI triggerRoundEnd: no draftable runes remaining');
      state.triggerRoundEnd();
    }
  }

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
 * Legacy exports for backward compatibility
 * @deprecated Use executeAITurn instead
 */
export const triggerAITurn = executeAITurn;

/**
 * @deprecated Use executeAIVoidEffect instead
 */
export function handleAIVoidEffect() {
}

/**
 * @deprecated Use executeAIFrostEffect instead
 */
export function handleAIFrostEffect() {
}
