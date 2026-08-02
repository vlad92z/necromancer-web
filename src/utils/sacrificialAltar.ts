import type { Player, Rune, SoloMapState } from '../types/game';
import { completeCurrentMapLocationEvent, getCurrentMapLocationEvent } from './soloMap';

export const SACRIFICIAL_ALTAR_HEALTH_COST = 10;

interface SacrificialAltarState {
  soloMap: SoloMapState;
  player: Player;
  fullDeck: Rune[];
}

export type SacrificialAltarResult = SacrificialAltarState & {
  status: 'invalid' | 'skipped' | 'sacrificed';
};

export function resolveSacrificialAltar(
  state: SacrificialAltarState,
  runeId: string | null,
): SacrificialAltarResult {
  const event = getCurrentMapLocationEvent(state.soloMap);
  if (event?.kind !== 'sacrificial-altar' || event.cleared) {
    return { ...state, status: 'invalid' };
  }

  if (runeId === null) {
    return {
      ...state,
      soloMap: completeCurrentMapLocationEvent(state.soloMap),
      status: 'skipped',
    };
  }

  const runeIndex = state.fullDeck.findIndex((rune) => rune.id === runeId);
  if (runeIndex === -1 || state.player.health <= SACRIFICIAL_ALTAR_HEALTH_COST) {
    return { ...state, status: 'invalid' };
  }

  return {
    soloMap: completeCurrentMapLocationEvent(state.soloMap),
    player: { ...state.player, health: state.player.health - SACRIFICIAL_ALTAR_HEALTH_COST },
    fullDeck: state.fullDeck.filter((_, index) => index !== runeIndex),
    status: 'sacrificed',
  };
}
