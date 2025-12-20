/**
 * Selection store - tracks transient user focus shared across views.
 */

import { create, type StoreApi } from 'zustand';
import type { Rune } from '../../types/game';

export interface SelectionStore {
  selectedCards: Rune[];
  setSelectedCards: (cards: Rune[]) => void;
  clearSelection: () => void;
}

/**
 * selectionStoreConfig - provides initial state for the selection store.
 */
export const selectionStoreConfig = (set: StoreApi<SelectionStore>['setState']): SelectionStore => ({
  selectedCards: [],
  setSelectedCards: (cards: Rune[]) => set(() => ({ selectedCards: cards })),
  clearSelection: () => set(() => ({ selectedCards: [] })),
});

export const useSelectionStore = create<SelectionStore>((set) => selectionStoreConfig(set));

/**
 * createSelectionStoreInstance - creates a new selection store instance.
 */
export function createSelectionStoreInstance(): StoreApi<SelectionStore> {
  return create<SelectionStore>((set) => selectionStoreConfig(set));
}
