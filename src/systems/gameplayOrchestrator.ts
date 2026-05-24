/**
 * Gameplay orchestrator - cross-store coordination for gameplay flows.
 */

import { addArcaneDust } from '../utils/arcaneDust';
import { clearSoloState } from '../utils/soloPersistence';
import { useArtefactStore } from '../state/stores/artefactStore';

let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null): void {
  navigationCallback = callback;
}

export function navigateToSoloRun(): void {
  navigationCallback?.();
}

export function getSelectedArtefactIds(): ReturnType<typeof useArtefactStore.getState>['selectedArtefactIds'] {
  return useArtefactStore.getState().selectedArtefactIds;
}

export function getArcaneDustTotal(): number {
  return useArtefactStore.getState().arcaneDust;
}

export function addGameplayArcaneDust(amount: number): number {
  const nextTotal = addArcaneDust(amount);
  useArtefactStore.getState().updateArcaneDust(nextTotal);
  return nextTotal;
}

export function clearPersistedSoloRun(): void {
  clearSoloState();
}
