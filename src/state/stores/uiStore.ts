/**
 * UI Store - Overlay states and transient UI state
 * Handles: overlay visibility, modal management, UI interactions
 */

import { create, type StoreApi } from 'zustand';

export interface UIStore {
  // Overlay visibility states
  showDeckOverlay: boolean;
  showSettingsOverlay: boolean;
  showOverloadOverlay: boolean;
  soundVolume: number;
  isMusicMuted: boolean;
  hasMusicSessionStarted: boolean;
  
  // Actions to toggle overlays
  openDeckOverlay: () => void;
  closeDeckOverlay: () => void;
  openSettingsOverlay: () => void;
  closeSettingsOverlay: () => void;
  openOverloadOverlay: () => void;
  closeOverloadOverlay: () => void;
  setSoundVolume: (volume: number) => void;
  setMusicMuted: (muted: boolean) => void;
  markMusicSessionStarted: () => void;
}

/**
 * getInitialVolume - returns the persisted volume or a default value.
 */
const getInitialVolume = (): number => {
  if (typeof window === 'undefined') {
    return 0.65;
  }
  const stored = Number.parseFloat(window.localStorage.getItem('soundVolume') ?? '');
  const normalized = Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : 0.65;
  return normalized;
};

/**
 * getInitialMusicMuted - returns whether music is persisted as muted.
 */
const getInitialMusicMuted = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.localStorage.getItem('musicMuted') === 'true';
};

/**
 * uiStoreConfig - provides initial state and actions for the UI store.
 */
export const uiStoreConfig = (set: StoreApi<UIStore>['setState']): UIStore => ({
  // Overlay visibility
  showDeckOverlay: false,
  showSettingsOverlay: false,
  showOverloadOverlay: false,
  // Audio settings
  soundVolume: getInitialVolume(),
  isMusicMuted: getInitialMusicMuted(),
  hasMusicSessionStarted: false,

  // Actions
  openDeckOverlay: () => {
    set({ showDeckOverlay: true });
  },

  closeDeckOverlay: () => {
    set({ showDeckOverlay: false });
  },

  openSettingsOverlay: () => {
    set({ showSettingsOverlay: true });
  },

  closeSettingsOverlay: () => {
    set({ showSettingsOverlay: false });
  },

  openOverloadOverlay: () => {
    set({ showOverloadOverlay: true });
  },

  closeOverloadOverlay: () => {
    set({ showOverloadOverlay: false });
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
});

export const useUIStore = create<UIStore>((set) => uiStoreConfig(set));

/**
 * createUIStoreInstance - creates a new UI store instance.
 */
export function createUIStoreInstance(): StoreApi<UIStore> {
  return create<UIStore>((set) => uiStoreConfig(set));
}
