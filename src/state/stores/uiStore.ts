/**
 * UI Store - Overlay states and transient UI state
 * Handles: overlay visibility, modal management, UI interactions
 */

import { create } from 'zustand';

interface UIStore {
  // Overlay visibility states
  showRulesOverlay: boolean;
  showDeckOverlay: boolean;
  showRuneforgeOverlay: boolean;
  selectedRuneforgeId: string | null; // For runeforge overlay
  soundVolume: number;
  
  // Actions to toggle overlays
  toggleRulesOverlay: () => void;
  toggleDeckOverlay: () => void;
  openRuneforgeOverlay: (runeforgeId: string) => void;
  closeRuneforgeOverlay: () => void;
  closeAllOverlays: () => void;
  setSoundVolume: (volume: number) => void;
}

const getInitialVolume = (): number => {
  if (typeof window === 'undefined') {
    return 0.65;
  }
  const stored = Number.parseFloat(window.localStorage.getItem('soundVolume') ?? '');
  const normalized = Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : 0.65;
  return normalized;
};

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  showRulesOverlay: false,
  showDeckOverlay: false,
  showRuneforgeOverlay: false,
  selectedRuneforgeId: null,
  soundVolume: getInitialVolume(),
  
  // Actions
  toggleRulesOverlay: () => {
    set((state) => ({ showRulesOverlay: !state.showRulesOverlay }));
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
      showDeckOverlay: false,
      showRuneforgeOverlay: false,
      selectedRuneforgeId: null,
    });
  },

  setSoundVolume: (volume: number) => {
    const clamped = Math.min(Math.max(volume, 0), 1);
    set({ soundVolume: clamped });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('soundVolume', clamped.toString());
    }
  },
}));
