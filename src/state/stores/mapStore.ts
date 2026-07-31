/**
 * Map Store - serializable solo adventure map state.
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, SoloMapState } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface MapState {
  soloMap: SoloMapState;
}

export interface MapStore extends MapState {
  replaceMapState: (next: MapState) => void;
}

export function pickMapState(state: GameState): MapState {
  return {
    soloMap: state.soloMap,
  };
}

export function createMapStore(initialState: MapState = pickMapState(initializeSoloGame())) {
  return create<MapStore>((set) => ({
    ...initialState,
    replaceMapState: (next) => set(() => next),
  }));
}

export const useMapStore = createMapStore();

export type MapStoreApi = StoreApi<MapStore>;
