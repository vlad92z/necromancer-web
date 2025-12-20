import { create, type StoreApi } from 'zustand';
import type { SoloGameState } from '../../types/game';
import { useSelectionStore } from './selectionStore';
import { clearSoloState, saveSoloState } from '../../utils/soloPersistence';
import { nextGame } from '../../utils/soloGameInitialization';
import { placeSelectionOnPatternLine } from './soloGameStoreHelpers';

export interface SoloGameStore extends SoloGameState {
    hydrate: (state: SoloGameState) => void;
    startNewRun: () => void;
    startNextGame: () => void;
    placeRunes: (patternLineIndex: number) => void;
}

/**
 * attachSoloPersistence - subscribes the solo store to local persistence.
 */
function attachSoloPersistence(store: StoreApi<SoloGameStore>): () => void {
  return store.subscribe((state) => {
    if (state.status === 'not-started') {
      return;
    }

    // If the player has been defeated, clear any saved solo run from localStorage
    if (state.status === 'defeat') {
      clearSoloState();
      return;
    }

    saveSoloState(state);
  });
}

/**
 * soloGameStoreConfig - provides the default state and actions for solo runs.
 */
export const soloGameStoreConfig = (set: StoreApi<SoloGameStore>['setState']): SoloGameStore => ({
    ...nextGame(),
    hydrate: (state: SoloGameState) => set(() => ({ ...state })),
    startNewRun: () => set(() => nextGame()),
    startNextGame: () => set((current) => nextGame(
        current.gameIndex + 1,
        current.playerStats,
        current.activeArtefacts,
        current.deck.allRunes,
    )),
    /**
     * placeRunes - place the selected runes on the requested pattern line.
     */
    placeRunes: (patternLineIndex: number) => {
      const selectedRunes = useSelectionStore.getState().selectedCards;
      let didPlaceRunes = false;
      set((state) => {
        const nextState = placeSelectionOnPatternLine(state, patternLineIndex, selectedRunes);
        didPlaceRunes = nextState !== state;
        return nextState;
      });
      if (didPlaceRunes) {
        useSelectionStore.getState().clearSelection();
      }
    },
});



export const useSoloGameStore = create<SoloGameStore>((set) => soloGameStoreConfig(set));
attachSoloPersistence(useSoloGameStore);

/**
 * createSoloGameStoreInstance - creates an isolated solo game store instance.
 */
export function createSoloGameStoreInstance() {
  const store = create<SoloGameStore>((set) => soloGameStoreConfig(set));
  attachSoloPersistence(store);
  return store;
}
