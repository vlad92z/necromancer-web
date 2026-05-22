/**
 * Gameplay analytics - isolates gameplay event tracking from store actions.
 */

import type { ArtefactId } from '../types/artefacts';
import type { Player } from '../types/game';
import { trackDefeatEvent, trackNewGameEvent } from '../utils/mixpanel';

interface NewGameAnalyticsEvent {
  gameNumber: number;
  activeArtefacts: ArtefactId[];
  deck: Player['deck'];
  targetScore: number;
  strain: number;
  startingHealth: number;
}

interface DefeatAnalyticsEvent {
  gameNumber: number;
  deck: Player['deck'];
  runePowerTotal: number;
  activeArtefacts: ArtefactId[];
  cause: 'overload' | 'deck-empty';
  strain: number;
  health: number;
  targetScore: number;
}

export function trackGameplayNewGame(event: NewGameAnalyticsEvent): void {
  trackNewGameEvent(event);
}

export function trackGameplayDefeat(event: DefeatAnalyticsEvent): void {
  trackDefeatEvent(event);
}
