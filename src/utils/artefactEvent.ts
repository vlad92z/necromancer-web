import type { ArtefactId } from '../types/artefacts';
import type { SoloMapState } from '../types/game';
import { completeCurrentMapLocationEvent, getCurrentMapLocationEvent } from './soloMap';

interface ArtefactEventState {
  soloMap: SoloMapState;
  activeArtefacts: ArtefactId[];
  arcaneDust: number;
}

export type ArtefactEventResult = ArtefactEventState & { status: 'invalid' | 'skipped' | 'claimed' };

export function resolveArtefactEvent(
  state: ArtefactEventState,
  shouldClaim: boolean,
): ArtefactEventResult {
  const event = getCurrentMapLocationEvent(state.soloMap);
  if (event?.kind !== 'artefact' || event.cleared) return { ...state, status: 'invalid' };

  if (!shouldClaim || !event.offeredArtefactId || event.arcaneDustReward === undefined) {
    return { ...state, soloMap: completeCurrentMapLocationEvent(state.soloMap), status: 'skipped' };
  }

  return {
    soloMap: completeCurrentMapLocationEvent(state.soloMap),
    activeArtefacts: state.activeArtefacts.includes(event.offeredArtefactId)
      ? state.activeArtefacts
      : [...state.activeArtefacts, event.offeredArtefactId],
    arcaneDust: state.arcaneDust + event.arcaneDustReward,
    status: 'claimed',
  };
}
