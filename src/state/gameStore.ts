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
      // TODO: Implement placement logic
      // 1. Validate pattern line can accept runes
      // 2. Fill pattern line with selectedRunes
      // 3. Handle overflow to floor line
      // 4. Clear selectedRunes
      console.log('Place runes on line:', patternLineIndex);
      return state;
    });
  },
  
  resetGame: () => {
    set(initializeGame());
  },
}));
