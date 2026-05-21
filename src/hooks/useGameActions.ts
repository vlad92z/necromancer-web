/**
 * Zustand action hooks for gameplay, artefact, selection, and UI stores.
 */

import { useShallow } from 'zustand/react/shallow';
import { useArtefactStore } from '../state/stores/artefactStore';
import { useGameplayStore } from '../state/stores/gameplayStore';
import { useSelectionStore } from '../state/stores/selectionStore';
import { useUIStore } from '../state/stores/uiStore';

export function useGameplayActions() {
  return useGameplayStore(
    useShallow((state) => ({
      acknowledgeChannelSound: state.acknowledgeChannelSound,
      acknowledgeOverloadSound: state.acknowledgeOverloadSound,
      cancelSelection: state.cancelSelection,
      disenchantRuneFromDeck: state.disenchantRuneFromDeck,
      draftRune: state.draftRune,
      endRound: state.endRound,
      hydrateGameState: state.hydrateGameState,
      moveRunesToWall: state.moveRunesToWall,
      placeRunes: state.placeRunes,
      placeRunesInFloor: state.placeRunesInFloor,
      prepareSoloMode: state.prepareSoloMode,
      resetTooltipCards: state.resetTooltipCards,
      returnToStartScreen: state.returnToStartScreen,
      selectDeckDraftRuneforge: state.selectDeckDraftRuneforge,
      setTooltipCards: state.setTooltipCards,
      startNextSoloGame: state.startNextSoloGame,
      startSoloRun: state.startSoloRun,
    })),
  );
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
      setAnimatingRuneIds: state.setAnimatingRuneIds,
      setIsPlacementAnimating: state.setIsPlacementAnimating,
      setMusicMuted: state.setMusicMuted,
      setPlayerHiddenPatternSlots: state.setPlayerHiddenPatternSlots,
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
