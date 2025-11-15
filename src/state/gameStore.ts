/**
 * Zustand store for game state management
 */

import { create } from 'zustand';
import type { GameState, Rune, RuneType, Player } from '../types/game';
import { initializeGame, fillFactories, createEmptyFactories } from '../utils/gameInitialization';
import { calculatePlacementScore, calculateFloorPenalty, getWallColumnForRune } from '../utils/scoring';

interface GameStore extends GameState {
  // Actions
  draftRune: (factoryId: string, runeType: RuneType) => void;
  draftFromCenter: (runeType: RuneType) => void;
  placeRunes: (patternLineIndex: number) => void;
  endRound: () => void;
  resetGame: () => void;
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
  
  endRound: () => {
    set((state) => {
      console.log('End of round scoring...');
      
      // Score both players
      const updatedPlayers = state.players.map((player) => {
        let newScore = player.score;
        const updatedPatternLines = [...player.patternLines];
        const updatedWall = player.wall.map((row) => [...row]);
        
        // Process completed pattern lines
        player.patternLines.forEach((line, lineIndex) => {
          if (line.count === line.tier && line.runeType) {
            // Line is complete - move one rune to wall
            const row = lineIndex; // Pattern line index = wall row
            const col = getWallColumnForRune(row, line.runeType);
            
            // Place rune on wall
            updatedWall[row][col] = { runeType: line.runeType };
            
            // Calculate and add score
            const points = calculatePlacementScore(updatedWall, row, col);
            newScore += points;
            
            console.log(`Player ${player.id}: Line ${lineIndex + 1} complete, placed ${line.runeType} at (${row},${col}), scored ${points} points`);
            
            // Clear the pattern line
            updatedPatternLines[lineIndex] = {
              tier: line.tier,
              runeType: null,
              count: 0,
            };
          }
        });
        
        // Apply floor line penalties
        const floorPenalty = calculateFloorPenalty(player.floorLine.runes.length);
        newScore = Math.max(0, newScore + floorPenalty); // Score can't go below 0
        
        console.log(`Player ${player.id}: Floor penalty ${floorPenalty}, new score ${newScore}`);
        
        return {
          ...player,
          patternLines: updatedPatternLines,
          wall: updatedWall,
          score: newScore,
          floorLine: {
            ...player.floorLine,
            runes: [], // Clear floor line
          },
        };
      }) as [Player, Player];
      
      // Prepare for next round
      const emptyFactories = createEmptyFactories(5);
      const combinedDeck = [...updatedPlayers[0].deck, ...updatedPlayers[1].deck];
      const filledFactories = fillFactories(emptyFactories, combinedDeck);
      
      return {
        ...state,
        players: updatedPlayers,
        factories: filledFactories,
        centerPool: [],
        turnPhase: 'draft',
        round: state.round + 1,
      };
    });
  },
  
  resetGame: () => {
    set(initializeGame());
  },
}));
