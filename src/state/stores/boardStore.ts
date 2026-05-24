/**
 * Board Store - player wall and deck state.
 */

import { create, type StoreApi } from 'zustand';
import type { GameState, Player } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface BoardState {
  player: Player;
}

export interface BoardStore extends BoardState {
  replaceBoardState: (next: BoardState) => void;
}

export function pickBoardState(state: GameState): BoardState {
  return {
    player: state.player,
  };
}

export function createBoardStore(initialState: BoardState = pickBoardState(initializeSoloGame())) {
  return create<BoardStore>((set) => ({
    ...initialState,
    replaceBoardState: (next) => set(() => next),
  }));
}

export const useBoardStore = createBoardStore();

export type BoardStoreApi = StoreApi<BoardStore>;
