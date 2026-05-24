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
  enemyMaxHealth: number;
  startingHealth: number;
}

interface DefeatAnalyticsEvent {
  gameNumber: number;
  deck: Player['deck'];
  activeArtefacts: ArtefactId[];
  cause: 'health-zero';
  health: number;
  enemyMaxHealth: number;
}

export function trackGameplayNewGame(event: NewGameAnalyticsEvent): void {
  trackNewGameEvent(event);
}

export function trackGameplayDefeat(event: DefeatAnalyticsEvent): void {
  trackDefeatEvent(event);
}
