/**
 * Zustand action hooks for gameplay, artefact, selection, and UI stores.
 */

import { useShallow } from 'zustand/react/shallow';
import { useArtefactStore } from '../state/stores/artefactStore';
import { gameplayActions } from '../state/stores/gameplayActions';
import { useUIStore } from '../state/stores/uiStore';

export function useGameplayActions() {
  return gameplayActions;
}

export function useArtefactActions() {
  return useArtefactStore(
    useShallow((state) => ({
      loadArtefactState: state.loadArtefactState,
      selectArtefact: state.selectArtefact,
      unselectArtefact: state.unselectArtefact,
    })),
  );
}

export function useUIActions() {
  return useUIStore(
    useShallow((state) => ({
      markMusicSessionStarted: state.markMusicSessionStarted,
      setMusicMuted: state.setMusicMuted,
      setSoundVolume: state.setSoundVolume,
      openRuneZoneOverlay: state.openRuneZoneOverlay,
      closeRuneZoneOverlay: state.closeRuneZoneOverlay,
      toggleMusicMuted: state.toggleMusicMuted,
      openSettingsOverlay: state.openSettingsOverlay,
      closeSettingsOverlay: state.closeSettingsOverlay,
    })),
  );
}

export function useSelectionActions() {
  return useUIStore(
    useShallow((state) => ({
      setActiveElement: state.setActiveElement,
    })),
  );
}
