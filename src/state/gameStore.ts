/**
 * Zustand store for game state management
 */

import { create } from 'zustand';
import type { GameState, Rune, RuneType } from '../types/game';
import { initializeGame } from '../utils/gameInitialization';

interface GameStore extends GameState {
  // Actions
  draftRune: (factoryId: string, runeType: RuneType) => void;
  draftFromCenter: (runeType: RuneType) => void;
  placeRunes: (patternLineIndex: number) => void;
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
      
      return {
        ...state,
        players: updatedPlayers,
        selectedRunes: [],
        turnPhase: 'draft' as const,
      };
    });
  },
  
  resetGame: () => {
    set(initializeGame());
  },
}));
