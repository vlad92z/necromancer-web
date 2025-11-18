/**
 * UI Store - Overlay states and transient UI state
 * Handles: overlay visibility, modal management, UI interactions
 */

import { create } from 'zustand';

interface UIStore {
  // Overlay visibility states
  showRulesOverlay: boolean;
  showGameLogOverlay: boolean;
  showDeckOverlay: boolean;
  showRuneforgeOverlay: boolean;
  selectedRuneforgeId: string | null; // For runeforge overlay
  
  // Actions to toggle overlays
  toggleRulesOverlay: () => void;
  toggleGameLogOverlay: () => void;
  toggleDeckOverlay: () => void;
  openRuneforgeOverlay: (runeforgeId: string) => void;
  closeRuneforgeOverlay: () => void;
  closeAllOverlays: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  showRulesOverlay: false,
  showGameLogOverlay: false,
  showDeckOverlay: false,
  showRuneforgeOverlay: false,
  selectedRuneforgeId: null,
  
  // Actions
  toggleRulesOverlay: () => {
    set((state) => ({ showRulesOverlay: !state.showRulesOverlay }));
  },
  
  toggleGameLogOverlay: () => {
    set((state) => ({ showGameLogOverlay: !state.showGameLogOverlay }));
  },
  
  toggleDeckOverlay: () => {
    set((state) => ({ showDeckOverlay: !state.showDeckOverlay }));
  },
  
  openRuneforgeOverlay: (runeforgeId: string) => {
    set({ showRuneforgeOverlay: true, selectedRuneforgeId: runeforgeId });
  },
  
  closeRuneforgeOverlay: () => {
    set({ showRuneforgeOverlay: false, selectedRuneforgeId: null });
  },
  
  closeAllOverlays: () => {
    set({
      showRulesOverlay: false,
      showGameLogOverlay: false,
      showDeckOverlay: false,
      showRuneforgeOverlay: false,
      selectedRuneforgeId: null,
    });
  },
}));
