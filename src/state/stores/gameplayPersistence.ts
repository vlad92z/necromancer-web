/**
 * Gameplay Persistence - solo persistence for composed split gameplay state.
 */

import type { GameState } from '../../types/game';
import { clearSoloState, saveSoloState } from '../../utils/soloPersistence';
import { subscribeGameplayState } from './gameplayState';

export function attachGameplayPersistence(): () => void {
  return subscribeGameplayState((state: GameState) => {
    if (state.isDefeat) {
      clearSoloState();
      return;
    }

    if (!state.gameStarted) {
      return;
    }

    saveSoloState(state);
  });
}
