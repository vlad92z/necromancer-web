/**
 * Player controller helpers for seat-side lookups
 */
import type { GameState, PlayerController, PlayerSide } from '../types/game';

export function getPlayerSideFromIndex(index: 0 | 1): PlayerSide {
  return index === 0 ? 'bottom' : 'top';
}

export function getControllerForIndex(
  state: Pick<GameState, 'playerControllers'>,
  index: 0 | 1
): PlayerController {
  const side = getPlayerSideFromIndex(index);
  return state.playerControllers[side];
}
