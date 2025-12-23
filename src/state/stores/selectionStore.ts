/**
 * Selection Store - rune selection state for drafting and placement flows.
 */

import { create } from 'zustand';
import type { DraftSource, Rune, SelectionState } from '../../types/game';
import type { ActiveElement } from '../../features/gameplay/components/keyboardNavigation';

type ActiveElementUpdate = ActiveElement | null | ((current: ActiveElement | null) => ActiveElement | null);

export interface SelectionStore extends SelectionState {
  activeElement: ActiveElement | null;
  setSelectionState: (next: Partial<SelectionState>) => void;
  replaceSelection: (next: SelectionState) => void;
  clearSelection: () => void;
  setSelection: (runes: Rune[], draftSource: DraftSource | null, selectionTimestamp: number | null) => void;
  setActiveElement: (next: ActiveElementUpdate) => void;
}

const emptySelection: SelectionState = {
  selectedRunes: [],
  draftSource: null,
  selectionTimestamp: null,
};

export const useSelectionStore = create<SelectionStore>((set) => ({
  ...emptySelection,
  activeElement: null,
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
  setActiveElement: (next) =>
    set((state) => ({
      ...state,
      activeElement: typeof next === 'function' ? next(state.activeElement) : next,
    })),
}));
