/**
 * Board Store - player board, runeforges, overload, and placement state.
 */

import { create, type StoreApi } from 'zustand';
import type { AnimatingRune, GameState, Player, Rune, Runeforge } from '../../types/game';
import { initializeSoloGame } from '../../utils/gameInitialization';

export interface BoardState {
  player: Player;
  runeforges: Runeforge[];
  runeforgeDraftStage: 'single' | 'global';
  overloadDamage: number;
  startingStrain: number;
  overloadRunes: Rune[];
  animatingRunes: AnimatingRune[];
  pendingPlacement: { patternLineIndex: number } | { floor: true } | null;
  lockedPatternLines: number[];
}

export interface BoardStore extends BoardState {
  replaceBoardState: (next: BoardState) => void;
}

export function pickBoardState(state: GameState): BoardState {
  return {
    player: state.player,
    runeforges: state.runeforges,
    runeforgeDraftStage: state.runeforgeDraftStage,
    overloadDamage: state.overloadDamage,
    startingStrain: state.startingStrain,
    overloadRunes: state.overloadRunes,
    animatingRunes: state.animatingRunes,
    pendingPlacement: state.pendingPlacement,
    lockedPatternLines: state.lockedPatternLines,
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
