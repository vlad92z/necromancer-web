/**
 * UI Store - Overlay states and persistent UI preferences
 * Handles: overlay visibility, modal management, UI interactions
 */

import { create } from 'zustand';
import type { TooltipCard } from '../../types/game';
import type { ActiveElement } from '../../features/gameplay/components/keyboardNavigation';
import { createDefaultTooltipCards } from '../../utils/gameInitialization';

interface UIStore {
  // Overlay visibility states
  showRulesOverlay: boolean;
  showDeckOverlay: boolean;
  showSettingsOverlay: boolean;
  soundVolume: number;
  isMusicMuted: boolean;
  hasMusicSessionStarted: boolean;
  tooltipCards: TooltipCard[];
  tooltipOverrideActive: boolean;
  activeElement: ActiveElement | null;
  
  // Actions to toggle overlays
  toggleRulesOverlay: () => void;
  toggleDeckOverlay: () => void;
  toggleSettingsOverlay: () => void;
  closeAllOverlays: () => void;
  setSoundVolume: (volume: number) => void;
  setMusicMuted: (muted: boolean) => void;
  toggleMusicMuted: () => void;
  markMusicSessionStarted: () => void;
  setTooltipCards: (cards: TooltipCard[], overrideSelection?: boolean) => void;
  resetTooltipCards: () => void;
  setActiveElement: (next: ActiveElement | null | ((current: ActiveElement | null) => ActiveElement | null)) => void;
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
  showSettingsOverlay: false,
  soundVolume: getInitialVolume(),
  isMusicMuted: getInitialMusicMuted(),
  hasMusicSessionStarted: false,
  tooltipCards: createDefaultTooltipCards(),
  tooltipOverrideActive: false,
  activeElement: null,
  
  // Actions
  toggleRulesOverlay: () => {
    set((state) => ({ showRulesOverlay: !state.showRulesOverlay }));
  },
  
  toggleDeckOverlay: () => {
    set((state) => ({ showDeckOverlay: !state.showDeckOverlay }));
  },
  
  toggleSettingsOverlay: () => {
    set((state) => ({ showSettingsOverlay: !state.showSettingsOverlay }));
  },
  
  closeAllOverlays: () => {
    set({
      showRulesOverlay: false,
      showDeckOverlay: false,
      showSettingsOverlay: false,
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

  toggleMusicMuted: () => {
    set((state) => ({ isMusicMuted: !state.isMusicMuted }));
  },

  markMusicSessionStarted: () => {
    set({ hasMusicSessionStarted: true });
  },

  setTooltipCards: (cards: TooltipCard[], overrideSelection = false) => {
    set({
      tooltipCards: cards,
      tooltipOverrideActive: overrideSelection,
    });
  },

  resetTooltipCards: () => {
    set({
      tooltipCards: createDefaultTooltipCards(),
      tooltipOverrideActive: false,
    });
  },

  setActiveElement: (next) => {
    set((state) => ({
      activeElement: typeof next === 'function' ? next(state.activeElement) : next,
    }));
  },
}));
