/**
 * Zustand store for game state management
 */

import { create } from 'zustand';
import type { GameState, RuneType, Player } from '../types/game';
import { initializeGame, fillFactories, createEmptyFactories } from '../utils/gameInitialization';
import { calculateWallPower, calculateWallPowerWithSegments, getWallColumnForRune } from '../utils/scoring';
import { makeAIMove } from '../utils/aiPlayer';

// Helper function to count Poison runes on a wall
function countPoisonRunes(wall: Player['wall']): number {
  return wall.flat().filter(cell => cell.runeType === 'Poison').length;
}

interface GameStore extends GameState {
  // Actions
  startGame: () => void;
  returnToStartScreen: () => void;
  draftRune: (factoryId: string, runeType: RuneType) => void;
  draftFromCenter: (runeType: RuneType) => void;
  placeRunes: (patternLineIndex: number) => void;
  placeRunesInFloor: () => void;
  cancelSelection: () => void;
  endRound: () => void;
  resetGame: () => void;
  triggerAITurn: () => void;
  completeAnimation: () => void; // Complete pending animation and apply placement
  processScoringStep: () => void; // Process next step in scoring animation
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  ...initializeGame(),
  
  // Actions
  draftRune: (factoryId: string, runeType: RuneType) => {
    set((state) => {
      // Find the factory
      const factory = state.factories.find((f) => f.id === factoryId);
      if (!factory) return state;
      
      // Separate runes by selected type
      const selectedRunes = factory.runes.filter((r) => r.runeType === runeType);
      const remainingRunes = factory.runes.filter((r) => r.runeType !== runeType);
      
      // If no runes of this type, do nothing
      if (selectedRunes.length === 0) return state;
      
      // Update factories (remove all runes from this factory)
      const updatedFactories = state.factories.map((f) =>
        f.id === factoryId ? { ...f, runes: [] } : f
      );
      
      // Move remaining runes to center pool
      const updatedCenterPool = [...state.centerPool, ...remainingRunes];
      
      return {
        ...state,
        factories: updatedFactories,
        centerPool: updatedCenterPool,
        selectedRunes: [...state.selectedRunes, ...selectedRunes],
        draftSource: { type: 'factory', factoryId, movedToCenter: remainingRunes },
      };
    });
  },
  
  draftFromCenter: (runeType: RuneType) => {
    set((state) => {
      // Get all runes of selected type from center
      const selectedRunes = state.centerPool.filter((r) => r.runeType === runeType);
      const remainingRunes = state.centerPool.filter((r) => r.runeType !== runeType);
      
      // If no runes of this type, do nothing
      if (selectedRunes.length === 0) return state;
      
      return {
        ...state,
        centerPool: remainingRunes,
        selectedRunes: [...state.selectedRunes, ...selectedRunes],
        draftSource: { type: 'center' },
      };
    });
  },
  
  placeRunes: (patternLineIndex: number) => {
    set((state) => {
      const { selectedRunes, currentPlayerIndex } = state;
      
      // No runes selected, do nothing
      if (selectedRunes.length === 0) return state;
      
      const currentPlayer = state.players[currentPlayerIndex];
      const patternLine = currentPlayer.patternLines[patternLineIndex];
      const runeType = selectedRunes[0].runeType;
      
      // Validation: Pattern line must be empty or have same rune type
      if (patternLine.runeType !== null && patternLine.runeType !== runeType) {
        // Invalid placement - different rune type
        return state;
      }
      
      // Validation: Pattern line must not be full
      if (patternLine.count >= patternLine.tier) {
        // Invalid placement - line is full
        return state;
      }
      
      // Validation: Check if this rune type is already on the wall in this row
      const row = patternLineIndex;
      const col = getWallColumnForRune(row, runeType);
      if (currentPlayer.wall[row][col].runeType !== null) {
        // Invalid placement - rune type already on wall in this row
        return state;
      }
      
      // Calculate how many runes fit in the pattern line
      const availableSpace = patternLine.tier - patternLine.count;
      const runesToPlace = Math.min(selectedRunes.length, availableSpace);
      const overflowRunes = selectedRunes.slice(runesToPlace);
      
      // Update pattern line
      const updatedPatternLines = [...currentPlayer.patternLines];
      updatedPatternLines[patternLineIndex] = {
        ...patternLine,
        runeType,
        count: patternLine.count + runesToPlace,
      };
      
      // Add overflow runes to floor line
      const updatedFloorLine = {
        ...currentPlayer.floorLine,
        runes: [...currentPlayer.floorLine.runes, ...overflowRunes],
      };
      
      // Update player
      const updatedPlayers: [typeof currentPlayer, typeof currentPlayer] = [
        ...state.players,
      ] as [typeof currentPlayer, typeof currentPlayer];
      
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        patternLines: updatedPatternLines,
        floorLine: updatedFloorLine,
      };
      
      // Switch to next player (alternate between 0 and 1)
      const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
      
      // Check if round should end (all factories and center empty)
      const allFactoriesEmpty = state.factories.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allFactoriesEmpty && centerEmpty;
      
      const newState = {
        ...state,
        players: updatedPlayers,
        selectedRunes: [],
        draftSource: null,
        turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
      };
      
      // If round ends, trigger scoring immediately
      if (shouldEndRound) {
        // Use setTimeout to trigger endRound after state update
        setTimeout(() => {
          useGameStore.getState().endRound();
        }, 0);
      }
      
      return newState;
    });
  },
  
  placeRunesInFloor: () => {
    set((state) => {
      const { selectedRunes, currentPlayerIndex } = state;
      
      // No runes selected, do nothing
      if (selectedRunes.length === 0) return state;
      
      const currentPlayer = state.players[currentPlayerIndex];
      
      // Add all selected runes to floor line
      const updatedFloorLine = {
        ...currentPlayer.floorLine,
        runes: [...currentPlayer.floorLine.runes, ...selectedRunes],
      };
      
      // Update player
      const updatedPlayers: [typeof currentPlayer, typeof currentPlayer] = [
        ...state.players,
      ] as [typeof currentPlayer, typeof currentPlayer];
      
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        floorLine: updatedFloorLine,
      };
      
      // Switch to next player (alternate between 0 and 1)
      const nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
      
      // Check if round should end (all factories and center empty)
      const allFactoriesEmpty = state.factories.every((f) => f.runes.length === 0);
      const centerEmpty = state.centerPool.length === 0;
      const shouldEndRound = allFactoriesEmpty && centerEmpty;
      
      const newState = {
        ...state,
        players: updatedPlayers,
        selectedRunes: [],
        draftSource: null,
        turnPhase: shouldEndRound ? ('scoring' as const) : ('draft' as const),
        currentPlayerIndex: nextPlayerIndex as 0 | 1,
      };
      
      // If round ends, trigger scoring with delay for visual effect
      if (shouldEndRound) {
        setTimeout(() => {
          useGameStore.getState().endRound();
        }, 1000); // 1 second delay before starting scoring animation
      }
      
      return newState;
    });
  },
  
  cancelSelection: () => {
    set((state) => {
      // Only allow cancellation if there are selected runes
      if (state.selectedRunes.length === 0 || !state.draftSource) return state;
      
      // Return selected runes to their original source
      if (state.draftSource.type === 'center') {
        return {
          ...state,
          centerPool: [...state.centerPool, ...state.selectedRunes],
          selectedRunes: [],
          draftSource: null,
        };
      } else {
        // Return to factory (both selected runes and the ones moved to center)
        const factoryId = state.draftSource.factoryId;
        const movedToCenter = state.draftSource.movedToCenter;
        
        // Remove the moved runes from center pool
        const updatedCenterPool = state.centerPool.filter(
          (rune) => !movedToCenter.some((moved) => moved.id === rune.id)
        );
        
        const updatedFactories = state.factories.map((f) =>
          f.id === factoryId
            ? { ...f, runes: [...f.runes, ...state.selectedRunes, ...movedToCenter] }
            : f
        );
        
        return {
          ...state,
          factories: updatedFactories,
          centerPool: updatedCenterPool,
          selectedRunes: [],
          draftSource: null,
        };
      }
    });
  },
  
  endRound: () => {
    set((state) => {
      console.log('End of round - starting scoring animation...');
      
      // Start scoring animation sequence
      return {
        ...state,
        scoringPhase: 'moving-to-wall' as const,
      };
    });
    
    // Start the scoring animation sequence
    setTimeout(() => {
      useGameStore.getState().processScoringStep();
    }, 1500); // 1.5 seconds to show "Moving to Wall" message
  },
  
  processScoringStep: () => {
    set((state) => {
      const currentPhase = state.scoringPhase;
      
      if (currentPhase === 'moving-to-wall') {
        console.log('Scoring: Moving runes to wall...');
        
        // Score both players - Move completed lines to wall
        const updatedPlayersArray = state.players.map((player) => {
        const updatedPatternLines = [...player.patternLines];
        const updatedWall = player.wall.map((row) => [...row]);
        
        // Process completed pattern lines - move runes to wall
        player.patternLines.forEach((line, lineIndex) => {
          if (line.count === line.tier && line.runeType) {
            // Line is complete - move one rune to wall
            const row = lineIndex; // Pattern line index = wall row
            const col = getWallColumnForRune(row, line.runeType);
            
            // Place rune on wall
            updatedWall[row][col] = { runeType: line.runeType };
            
            console.log(`Player ${player.id}: Line ${lineIndex + 1} complete, placed ${line.runeType} at (${row},${col})`);
            
            // Clear the pattern line
            updatedPatternLines[lineIndex] = {
              tier: line.tier,
              runeType: null,
              count: 0,
            };
          }
        });
        
        // Calculate total wall power based on connected segments
        // Floor penalties reduce the multiplier of each segment
        const floorPenaltyCount = player.floorLine.runes.length;
        
        // Get opponent's Poison count (for Poison effect)
        const opponentIndex = state.players.indexOf(player) === 0 ? 1 : 0;
        const opponentPoisonCount = countPoisonRunes(state.players[opponentIndex].wall);
        
        const wallPower = calculateWallPower(updatedWall, floorPenaltyCount, opponentPoisonCount);
        
        // Add wall power to existing score (minimum 0)
        const newScore = Math.max(0, player.score + wallPower);
        
        console.log(`Player ${player.id}: Wall power ${wallPower} (with ${floorPenaltyCount} floor penalties), Total score ${newScore}`);
        
        return {
          ...player,
          patternLines: updatedPatternLines,
          wall: updatedWall,
          score: player.score, // Don't update score yet, just move runes
          floorLine: player.floorLine, // Don't clear floor yet
        };
      });
      
      const updatedPlayers: [Player, Player] = [updatedPlayersArray[0], updatedPlayersArray[1]];
      
      // Move to calculating score phase
      setTimeout(() => {
        useGameStore.getState().processScoringStep();
      }, 2000); // 2 seconds to see runes move to wall
      
      return {
        ...state,
        players: updatedPlayers,
        scoringPhase: 'calculating-score' as const,
      };
    } else if (currentPhase === 'calculating-score') {
      console.log('Scoring: Calculating scores...');
      
      // Calculate and apply scores, and record round history
      const updatedPlayersArray = state.players.map((player, playerIndex) => {
        const floorPenaltyCount = player.floorLine.runes.length;
        
        // Get opponent's Poison count (for Poison effect)
        const opponentIndex = playerIndex === 0 ? 1 : 0;
        const opponentPoisonCount = countPoisonRunes(state.players[opponentIndex].wall);
        
        const wallPower = calculateWallPower(player.wall, floorPenaltyCount, opponentPoisonCount);
        const newScore = Math.max(0, player.score + wallPower);
        
        console.log(`Player ${player.id}: Wall power ${wallPower} (with ${floorPenaltyCount} floor penalties, ${opponentPoisonCount} opponent Poison), Total score ${newScore}`);
        
        return {
          ...player,
          score: newScore,
        };
      });
      
      const updatedPlayers: [Player, Player] = [updatedPlayersArray[0], updatedPlayersArray[1]];
      
      // Record round history for game log
      // Pass opponent Poison counts for accurate display
      const player1PoisonCount = countPoisonRunes(updatedPlayers[0].wall);
      const player2PoisonCount = countPoisonRunes(updatedPlayers[1].wall);
      
      const player1Data = calculateWallPowerWithSegments(
        updatedPlayers[0].wall, 
        updatedPlayers[0].floorLine.runes.length,
        player2PoisonCount // Player 1 is affected by Player 2's Poison
      );
      const player2Data = calculateWallPowerWithSegments(
        updatedPlayers[1].wall, 
        updatedPlayers[1].floorLine.runes.length,
        player1PoisonCount // Player 2 is affected by Player 1's Poison
      );
      
      const roundScore = {
        round: state.round,
        playerName: updatedPlayers[0].name,
        playerEssence: player1Data.essence,
        playerFocus: player1Data.focus,
        playerTotal: player1Data.totalPower,
        opponentName: updatedPlayers[1].name,
        opponentEssence: player2Data.essence,
        opponentFocus: player2Data.focus,
        opponentTotal: player2Data.totalPower,
      };
      
      // Move to clearing floor phase
      setTimeout(() => {
        useGameStore.getState().processScoringStep();
      }, 2000); // 2 seconds to see score updates
      
      return {
        ...state,
        players: updatedPlayers,
        roundHistory: [...state.roundHistory, roundScore],
        scoringPhase: 'clearing-floor' as const,
      };
    } else if (currentPhase === 'clearing-floor') {
      console.log('Scoring: Clearing floor lines...');
      
      // Clear floor lines
      const updatedPlayersArray = state.players.map((player) => ({
        ...player,
        floorLine: {
          ...player.floorLine,
          runes: [],
        },
      }));
      
      const updatedPlayers: [Player, Player] = [updatedPlayersArray[0], updatedPlayersArray[1]];
      
      // Move to complete phase
      setTimeout(() => {
        useGameStore.getState().processScoringStep();
      }, 1500); // 1.5 seconds to see floor clear
      
      return {
        ...state,
        players: updatedPlayers,
        scoringPhase: 'complete' as const,
      };
    } else if (currentPhase === 'complete') {
      console.log('Scoring: Complete, checking game over...');
      
      // Check if either player has run out of runes (need 10 runes minimum for 5 factories)
      const player1HasEnough = state.players[0].deck.length >= 10;
      const player2HasEnough = state.players[1].deck.length >= 10;
      
      if (!player1HasEnough || !player2HasEnough) {
        console.log('Game over! A player has run out of runes.');
        console.log(`Player 1 runes: ${state.players[0].deck.length}, Player 2 runes: ${state.players[1].deck.length}`);
        
        return {
          ...state,
          factories: [],
          centerPool: [],
          turnPhase: 'game-over',
          round: state.round,
          scoringPhase: null,
        };
      }
      
      // Prepare for next round
      const emptyFactories = createEmptyFactories(5);
      const { factories: filledFactories, deck1, deck2 } = fillFactories(
        emptyFactories, 
        state.players[0].deck, 
        state.players[1].deck
      );
      
      // Update player decks with remaining runes after filling factories
      const finalPlayers: [Player, Player] = [
        { ...state.players[0], deck: deck1 },
        { ...state.players[1], deck: deck2 }
      ];
      
      console.log('Round complete! Starting next round...');
      
      return {
        ...state,
        players: finalPlayers,
        factories: filledFactories,
        centerPool: [],
        turnPhase: 'draft',
        round: state.round + 1,
        scoringPhase: null,
      };
    }
    
    return state;
    });
  },
  
  startGame: () => {
    set((state) => ({
      ...state,
      gameStarted: true,
    }));
  },

  returnToStartScreen: () => {
    // Reset game and return to start screen
    set({
      ...initializeGame(),
      gameStarted: false,
    });
  },
  
  resetGame: () => {
    set(initializeGame());
  },

  triggerAITurn: () => {
    const state = useGameStore.getState();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    // Only trigger if it's AI's turn and in draft phase
    if (currentPlayer.type === 'ai' && state.turnPhase === 'draft') {
      // Add a delay to make AI moves visible
      setTimeout(() => {
        const currentState = useGameStore.getState();
        const moveMade = makeAIMove(
          currentState,
          useGameStore.getState().draftRune,
          useGameStore.getState().draftFromCenter,
          useGameStore.getState().placeRunes,
          useGameStore.getState().placeRunesInFloor
        );
        
        // If the AI just drafted runes, it needs to place them too
        // Check again after a delay
        if (moveMade) {
          setTimeout(() => {
            const newState = useGameStore.getState();
            // If still AI's turn and has selected runes, make placement move
            if (newState.players[newState.currentPlayerIndex].type === 'ai' && 
                newState.selectedRunes.length > 0) {
              makeAIMove(
                newState,
                useGameStore.getState().draftRune,
                useGameStore.getState().draftFromCenter,
                useGameStore.getState().placeRunes,
                useGameStore.getState().placeRunesInFloor
              );
            }
          }, 2000);
        }
      }, 2000);
    }
  },

  completeAnimation: () => {
    set((state) => ({
      ...state,
      animatingRunes: [],
      pendingPlacement: null,
    }));
  },
}));
