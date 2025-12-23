/**
 * Rune counting helpers for drafting UI
 */

import type { Rune, RuneType, Runeforge } from '../types/game';

interface RuneTypeCountInput {
  runeforges: Runeforge[];
  selectedRunes: Rune[];
}

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
