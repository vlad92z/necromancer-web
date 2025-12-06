/**
 * Arcane Dust persistence helpers - stores meta-currency locally
 */

const ARCANE_DUST_KEY = 'necromancer-arcane-dust';

const canAccessStorage = (): boolean => typeof window !== 'undefined';

export function getArcaneDust(): number {
  if (!canAccessStorage()) return 0;
  const rawValue = window.localStorage.getItem(ARCANE_DUST_KEY);
  if (!rawValue) return 0;

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function saveArcaneDust(amount: number): number {
  const normalized = Math.max(0, Math.floor(amount));
  if (!canAccessStorage()) return normalized;

  try {
    window.localStorage.setItem(ARCANE_DUST_KEY, normalized.toString());
  } catch (error) {
    console.error('Failed to save Arcane Dust', error);
  }

  return normalized;
}

export function addArcaneDust(amount: number): number {
  const current = getArcaneDust();
  const nextTotal = Math.max(0, Math.floor(current + amount));
  return saveArcaneDust(nextTotal);
}

export function getArcaneDustReward(game: number): number {
  const normalizedGame = Math.max(0, Math.floor(game));
  return normalizedGame * 50;
}
