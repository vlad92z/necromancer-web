/**
 * Artefact persistence helpers - stores player artefact state locally
 */

import type { ArtefactId } from '../types/artefacts';
import { MAX_SELECTED_ARTEFACTS } from '../types/artefacts';

const OWNED_ARTEFACTS_KEY = 'necromancer-owned-artefacts';
const SELECTED_ARTEFACTS_KEY = 'necromancer-selected-artefacts';

const canAccessStorage = (): boolean => typeof window !== 'undefined';

export function getOwnedArtefacts(): ArtefactId[] {
  if (!canAccessStorage()) return [];
  const rawValue = window.localStorage.getItem(OWNED_ARTEFACTS_KEY);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOwnedArtefacts(artefactIds: ArtefactId[]): ArtefactId[] {
  if (!canAccessStorage()) return artefactIds;

  try {
    window.localStorage.setItem(OWNED_ARTEFACTS_KEY, JSON.stringify(artefactIds));
  } catch (error) {
    console.error('Failed to save owned artefacts', error);
  }

  return artefactIds;
}

export function addOwnedArtefact(artefactId: ArtefactId): ArtefactId[] {
  const owned = getOwnedArtefacts();
  if (owned.includes(artefactId)) {
    return owned;
  }
  const updated = [...owned, artefactId];
  return saveOwnedArtefacts(updated);
}

export function getSelectedArtefacts(): ArtefactId[] {
  if (!canAccessStorage()) return [];
  const rawValue = window.localStorage.getItem(SELECTED_ARTEFACTS_KEY);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSelectedArtefacts(artefactIds: ArtefactId[]): ArtefactId[] {
  // Ensure max artefacts limit
  const normalized = artefactIds.slice(0, MAX_SELECTED_ARTEFACTS);
  if (!canAccessStorage()) return normalized;

  try {
    window.localStorage.setItem(SELECTED_ARTEFACTS_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.error('Failed to save selected artefacts', error);
  }

  return normalized;
}
