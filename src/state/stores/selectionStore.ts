/**
 * Selection Store - rune selection state for drafting and placement flows.
 */

import { create } from 'zustand';
import type { DraftSource, Rune, SelectionState } from '../../types/game';

export interface SelectionStore extends SelectionState {
  setSelectionState: (next: Partial<SelectionState>) => void;
  replaceSelection: (next: SelectionState) => void;
  clearSelection: () => void;
  setSelection: (runes: Rune[], draftSource: DraftSource | null, selectionTimestamp: number | null) => void;
}

const emptySelection: SelectionState = {
  selectedRunes: [],
  draftSource: null,
  selectionTimestamp: null,
};

export const useSelectionStore = create<SelectionStore>((set) => ({
  ...emptySelection,
  setSelectionState: (next) =>
    set((state) => ({
      ...state,
      ...next,
    })),
  replaceSelection: (next) => set(() => ({ ...next })),
  clearSelection: () => set(() => ({ ...emptySelection })),
  setSelection: (runes, draftSource, selectionTimestamp) =>
    set(() => ({
      selectedRunes: [...runes],
      draftSource,
      selectionTimestamp,
    })),
}));
