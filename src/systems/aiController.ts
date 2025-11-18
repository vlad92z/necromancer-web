/**
 * AI Controller - Orchestrates AI turns and effect handling
 * Separates AI logic from App.tsx component
 */

import type { GameState } from '../types/game';
import { makeAIMove, chooseRuneforgeToDestroy, chooseRuneforgeToFreeze } from '../utils/aiPlayer';
import { useGameplayStore } from '../state/stores/gameplayStore';

/**
 * Trigger an AI turn (draft + placement)
 */
export function triggerAITurn() {
  const state = useGameplayStore.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  // Only trigger if it's AI's turn and in draft phase
  if (currentPlayer.type === 'ai' && state.turnPhase === 'draft') {
    // Add a delay to make AI moves visible
    setTimeout(() => {
      const currentState = useGameplayStore.getState();
      const moveMade = makeAIMove(
        currentState,
        useGameplayStore.getState().draftRune,
        useGameplayStore.getState().draftFromCenter,
        useGameplayStore.getState().placeRunes,
        useGameplayStore.getState().placeRunesInFloor
      );
      
      // If the AI just drafted runes, it needs to place them too
      // Check again after a delay
      if (moveMade) {
        setTimeout(() => {
          const newState = useGameplayStore.getState();
          // If still AI's turn and has selected runes, make placement move
          if (newState.players[newState.currentPlayerIndex].type === 'ai' && 
              newState.selectedRunes.length > 0) {
            makeAIMove(
              newState,
              useGameplayStore.getState().draftRune,
              useGameplayStore.getState().draftFromCenter,
              useGameplayStore.getState().placeRunes,
              useGameplayStore.getState().placeRunesInFloor
            );
          }
        }, 2000);
      }
    }, 2000);
  }
}

/**
 * Handle AI Void effect (runeforge destruction)
 */
export function handleAIVoidEffect(gameState: GameState) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // AI chooses runeforge when it's their turn AND Void effect is pending
  if (currentPlayer.type === 'ai' && gameState.voidEffectPending && gameState.turnPhase === 'draft') {
    setTimeout(() => {
      const runeforgeToDestroy = chooseRuneforgeToDestroy(gameState);
      if (runeforgeToDestroy) {
        useGameplayStore.getState().destroyRuneforge(runeforgeToDestroy);
      } else {
        useGameplayStore.getState().skipVoidEffect();
      }
    }, 1500);
  }
}

/**
 * Handle AI Frost effect (runeforge freezing)
 */
export function handleAIFrostEffect(gameState: GameState) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // AI chooses runeforge when it's their turn AND Frost effect is pending
  if (currentPlayer.type === 'ai' && gameState.frostEffectPending && gameState.turnPhase === 'draft') {
    setTimeout(() => {
      const runeforgeToFreeze = chooseRuneforgeToFreeze(gameState);
      if (runeforgeToFreeze) {
        useGameplayStore.getState().freezeRuneforge(runeforgeToFreeze);
      }
    }, 1500);
  }
}
