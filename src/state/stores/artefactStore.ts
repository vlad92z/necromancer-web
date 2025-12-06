/**
 * Artefact Store - manages artefact ownership and selection
 */

import { create } from 'zustand';
import type { ArtefactId } from '../../types/artefacts';
import { ARTEFACTS, MAX_SELECTED_ARTEFACTS } from '../../types/artefacts';
import { getOwnedArtefacts, saveOwnedArtefacts, getSelectedArtefacts, saveSelectedArtefacts } from '../../utils/artefactPersistence';
import { getArcaneDust, saveArcaneDust } from '../../utils/arcaneDust';

export interface ArtefactStore {
  ownedArtefactIds: ArtefactId[];
  selectedArtefactIds: ArtefactId[];
  arcaneDust: number;

  // Actions
  selectArtefact: (id: ArtefactId) => void;
  unselectArtefact: (id: ArtefactId) => void;
  buyArtefact: (id: ArtefactId) => boolean;
  loadArtefactState: () => void;
  updateArcaneDust: (amount: number) => void;
}

export const useArtefactStore = create<ArtefactStore>((set, get) => ({
  ownedArtefactIds: getOwnedArtefacts(),
  selectedArtefactIds: getSelectedArtefacts(),
  arcaneDust: getArcaneDust(),

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

  buyArtefact: (id: ArtefactId) => {
    const { ownedArtefactIds, arcaneDust } = get();

    // Cannot buy if already owned
    if (ownedArtefactIds.includes(id)) {
      return false;
    }

    const artefact = ARTEFACTS[id];
    if (!artefact) {
      return false;
    }

    // Cannot buy if not enough Arcane Dust
    if (arcaneDust < artefact.cost) {
      return false;
    }

    // Deduct cost and add to owned
    const newDust = arcaneDust - artefact.cost;
    saveArcaneDust(newDust);

    const updatedOwned = [...ownedArtefactIds, id];
    saveOwnedArtefacts(updatedOwned);

    set({
      arcaneDust: newDust,
      ownedArtefactIds: updatedOwned,
    });

    return true;
  },

  loadArtefactState: () => {
    set({
      ownedArtefactIds: getOwnedArtefacts(),
      selectedArtefactIds: getSelectedArtefacts(),
      arcaneDust: getArcaneDust(),
    });
  },

  updateArcaneDust: (amount: number) => {
    set({ arcaneDust: amount });
  },
}));
