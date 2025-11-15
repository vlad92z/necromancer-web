/**
 * Zustand store for game state management
 */

import { create } from 'zustand';
import type { GameState, Rune, RuneType } from '../types/game';
import { initializeGame } from '../utils/gameInitialization';

interface GameStore extends GameState {
  // Actions
  draftRune: (factoryId: string, runeType: RuneType) => void;
  placeRunes: (patternLineIndex: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  ...initializeGame(),
  
  // Actions
  draftRune: (factoryId: string, runeType: RuneType) => {
    set((state) => {
      // TODO: Implement draft logic
      // 1. Find factory with factoryId
      // 2. Remove all runes of runeType from factory
      // 3. Move remaining runes to centerPool
      // 4. Add selected runes to selectedRunes
      console.log('Draft rune:', factoryId, runeType);
      return state;
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
