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
      buyArtefact: state.buyArtefact,
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
      setTooltipCards: state.setTooltipCards,
      resetTooltipCards: state.resetTooltipCards,
      setSoundVolume: state.setSoundVolume,
      openRuneZoneOverlay: state.openRuneZoneOverlay,
      closeRuneZoneOverlay: state.closeRuneZoneOverlay,
      toggleMusicMuted: state.toggleMusicMuted,
      toggleSettingsOverlay: state.toggleSettingsOverlay,
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
