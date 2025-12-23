/**
 * UI Store - Overlay states and transient UI state
 * Handles: overlay visibility, modal management, UI interactions
 */

import { create } from 'zustand';

interface UIStore {
  // Overlay visibility states
  showRulesOverlay: boolean;
  showDeckOverlay: boolean;
  showOverloadOverlay: boolean
  showRuneforgeOverlay: boolean;
  showSettingsOverlay: boolean;
  selectedRuneforgeId: string | null; // For runeforge overlay
  soundVolume: number;
  isMusicMuted: boolean;
  hasMusicSessionStarted: boolean;
  hiddenPatternLines: Set<number>;
  
  // Actions to toggle overlays
  toggleRulesOverlay: () => void;
  toggleDeckOverlay: () => void;
  toggleOverloadOverlay: () => void;
  openRuneforgeOverlay: (runeforgeId: string) => void;
  closeRuneforgeOverlay: () => void;
  toggleSettingsOverlay: () => void;
  closeAllOverlays: () => void;
  setSoundVolume: (volume: number) => void;
  setMusicMuted: (muted: boolean) => void;
  markMusicSessionStarted: () => void;
  setHiddenPatternLines: (indices: Set<number>) => void;
}

const getInitialVolume = (): number => {
  if (typeof window === 'undefined') {
    return 0.65;
  }
  const stored = Number.parseFloat(window.localStorage.getItem('soundVolume') ?? '');
  const normalized = Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : 0.65;
  return normalized;
};

const getInitialMusicMuted = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem('musicMuted') === 'true';
};

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  showRulesOverlay: false,
  showDeckOverlay: false,
  showOverloadOverlay: false,
  showRuneforgeOverlay: false,
  showSettingsOverlay: false,
  selectedRuneforgeId: null,
  soundVolume: getInitialVolume(),
  isMusicMuted: getInitialMusicMuted(),
  hasMusicSessionStarted: false,
  hiddenPatternLines: new Set<number>(),
  
  // Actions
  toggleRulesOverlay: () => {
    set((state) => ({ showRulesOverlay: !state.showRulesOverlay }));
  },
  
  toggleDeckOverlay: () => {
    set((state) => ({ showDeckOverlay: !state.showDeckOverlay }));
  },

  toggleOverloadOverlay: () => {
    set((state) => ({ showOverloadOverlay: !state.showOverloadOverlay }));
  }
  
  openRuneforgeOverlay: (runeforgeId: string) => {
    set({ showRuneforgeOverlay: true, selectedRuneforgeId: runeforgeId });
  },
  
  closeRuneforgeOverlay: () => {
    set({ showRuneforgeOverlay: false, selectedRuneforgeId: null });
  },
  
  toggleSettingsOverlay: () => {
    set((state) => ({ showSettingsOverlay: !state.showSettingsOverlay }));
  },
  
  closeAllOverlays: () => {
    set({
      showRulesOverlay: false,
      showDeckOverlay: false,
      showRuneforgeOverlay: false,
      showSettingsOverlay: false,
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

  setMusicMuted: (muted: boolean) => {
    set({ isMusicMuted: muted });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('musicMuted', muted ? 'true' : 'false');
    }
  },

  markMusicSessionStarted: () => {
    set({ hasMusicSessionStarted: true });
  },

  setHiddenPatternLines: (indices: Set<number>) => {
    set({ hiddenPatternLines: indices });
  }
}));
