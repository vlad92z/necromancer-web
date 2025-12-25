/**
 * Rune counting helpers for drafting UI
 */

import type { Rune, RuneType, Runeforge } from '../types/game';

interface RuneTypeCountInput {
  runeforges: Runeforge[];
  selectedRunes: Rune[];
}

//TODO: Use runeTypeCounts instead
export function getRuneTypeCounts({
  runeforges,
  selectedRunes,
}: RuneTypeCountInput): Record<RuneType, number> {
  const counts: Record<RuneType, number> = {
    Fire: 0,
    Frost: 0,
    Life: 0,
    Void: 0,
    Wind: 0,
    Lightning: 0,
  };
  const countedIds = new Set<string>();

  const countRune = (rune: Rune) => {
    if (countedIds.has(rune.id)) {
      return;
    }
    counts[rune.runeType] = (counts[rune.runeType] ?? 0) + 1;
    countedIds.add(rune.id);
  };

  runeforges.forEach((forge) => {
    const forgeRunes = forge.runes;
    forgeRunes.forEach(countRune);
  });

  selectedRunes.forEach(countRune);

  return counts;
}

export function runeTypeCounts(runes: Rune[]): Map<RuneType, number> {
  const counts = new Map<RuneType, number>();
  runes.forEach((rune) => {
    const currentCount = counts.get(rune.runeType) ?? 0
    counts.set(rune.runeType, currentCount + 1);
  });
  return counts;
}
