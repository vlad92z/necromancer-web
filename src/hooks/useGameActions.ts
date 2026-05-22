/**
 * Zustand action hooks for gameplay, artefact, selection, and UI stores.
 */

import { useShallow } from 'zustand/react/shallow';
import { useArtefactStore } from '../state/stores/artefactStore';
import { gameplayActions } from '../state/stores/gameplayActions';
import { useSelectionStore } from '../state/stores/selectionStore';
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
      toggleDeckOverlay: state.toggleDeckOverlay,
      toggleMusicMuted: state.toggleMusicMuted,
      toggleOverloadOverlay: state.toggleOverloadOverlay,
      toggleSettingsOverlay: state.toggleSettingsOverlay,
    })),
  );
}

export function useSelectionActions() {
  return useSelectionStore(
    useShallow((state) => ({
      clearSelection: state.clearSelection,
      replaceSelection: state.replaceSelection,
      setActiveElement: state.setActiveElement,
      setSelection: state.setSelection,
      setSelectionState: state.setSelectionState,
    })),
  );
}
