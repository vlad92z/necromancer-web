/**
 * Rune utility functions
 */

import type { Rune, RuneType } from "../types/game";

export function getPrimaryRuneType(rune: Pick<Rune, 'runeTypes'>): RuneType {
  const runeType = rune.runeTypes[0];
  if (!runeType) {
    throw new Error(`Rune must have at least one type`);
  }
  return runeType;
}

export function runeHasType(rune: Pick<Rune, 'runeTypes'>, runeType: RuneType): boolean {
  return rune.runeTypes.includes(runeType);
}

export function primaryRuneFirst(runes: Rune[], primaryRuneId: string): Rune[] {
  const primaryRune = runes.find((rune) => rune.id === primaryRuneId);
  if (!primaryRune) {
    return runes;
  }
  return [primaryRune, ...runes.filter((rune) => rune.id !== primaryRuneId)];
}
