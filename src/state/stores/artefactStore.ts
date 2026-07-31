/**
 * Artefact Store - manages artefact ownership and selection
 */

import { create } from 'zustand';
import type { ArtefactId } from '../../types/artefacts';
import { MAX_SELECTED_ARTEFACTS } from '../../types/artefacts';
import { getOwnedArtefacts, getSelectedArtefacts, saveSelectedArtefacts } from '../../utils/artefactPersistence';

export interface ArtefactStore {
  ownedArtefactIds: ArtefactId[];
  selectedArtefactIds: ArtefactId[];
  // Actions
  selectArtefact: (id: ArtefactId) => void;
  unselectArtefact: (id: ArtefactId) => void;
  loadArtefactState: () => void;
}

export const useArtefactStore = create<ArtefactStore>((set, get) => ({
  ownedArtefactIds: getOwnedArtefacts(),
  selectedArtefactIds: getSelectedArtefacts(),

  selectArtefact: (id: ArtefactId) => {
    const { selectedArtefactIds, ownedArtefactIds } = get();

    // Cannot select if not owned
    if (!ownedArtefactIds.includes(id)) {
      return;
    }

    // Cannot select if already selected
    if (selectedArtefactIds.includes(id)) {
      return;
    }

    // Cannot select more than max allowed
    if (selectedArtefactIds.length >= MAX_SELECTED_ARTEFACTS) {
      return;
    }

    const updated = [...selectedArtefactIds, id];
    saveSelectedArtefacts(updated);
    set({ selectedArtefactIds: updated });
  },

  unselectArtefact: (id: ArtefactId) => {
    const { selectedArtefactIds } = get();

    if (!selectedArtefactIds.includes(id)) {
      return;
    }

    const updated = selectedArtefactIds.filter((artefactId) => artefactId !== id);
    saveSelectedArtefacts(updated);
    set({ selectedArtefactIds: updated });
  },

  loadArtefactState: () => {
    set({
      ownedArtefactIds: getOwnedArtefacts(),
      selectedArtefactIds: getSelectedArtefacts(),
    });
  },
}));
