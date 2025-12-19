import { create, type StoreApi } from 'zustand';
import type { SoloGameState } from "../../types/game";
import { clearSoloState, saveSoloState } from '../../utils/soloPersistence';
import { nextGame } from '../../utils/soloGameInitialization';

export interface SoloGameStore extends SoloGameState {
    hydrate: (state: SoloGameState) => void;
    startNewRun: () => void;
    startNextGame: () => void;
}

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
});



export const useSoloGameStore = create<SoloGameStore>((set) => soloGameStoreConfig(set));
attachSoloPersistence(useSoloGameStore);

export function createSoloGameStoreInstance() {
  const store = create<SoloGameStore>((set) => soloGameStoreConfig(set));
  attachSoloPersistence(store);
  return store;
}