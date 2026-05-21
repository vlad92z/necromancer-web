/**
 * Gameplay orchestrator - cross-store coordination for gameplay flows.
 */

import type { SelectionState } from '../types/game';
import { addArcaneDust } from '../utils/arcaneDust';
import { clearSoloState } from '../utils/soloPersistence';
import { useArtefactStore } from '../state/stores/artefactStore';
import { useSelectionStore } from '../state/stores/selectionStore';

let navigationCallback: (() => void) | null = null;

export function setNavigationCallback(callback: (() => void) | null): void {
  navigationCallback = callback;
}

export function navigateToSoloRun(): void {
  navigationCallback?.();
}

export function clearGameplaySelection(): void {
  useSelectionStore.getState().clearSelection();
}

export function getGameplaySelection(): SelectionState {
  const { selectedRunes, draftSource, selectionTimestamp } = useSelectionStore.getState();
  return { selectedRunes, draftSource, selectionTimestamp };
}

export function setGameplaySelection(next: Partial<SelectionState>): void {
  useSelectionStore.getState().setSelectionState(next);
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
