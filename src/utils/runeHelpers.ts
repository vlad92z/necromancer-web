/**
 * Rune utility functions
 */

import type { Rune } from "../types/game";

export function primaryRuneFirst(runes: Rune[], primaryRuneId: string): Rune[] {
  const primaryRune = runes.find((rune) => rune.id === primaryRuneId);
  if (!primaryRune) {
    return runes;
  }
  return [primaryRune, ...runes.filter((rune) => rune.id !== primaryRuneId)];
}
