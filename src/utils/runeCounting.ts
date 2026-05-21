/**
 * Rune counting helpers for drafting UI
 */

import type { Rune, RuneType, Runeforge } from '../types/game';
import { RUNE_TYPES } from './gameInitialization';

interface RuneTypeCountInput {
  runeforges: Runeforge[];
  selectedRunes: Rune[];
}

export function getRuneTypeCounts({
  runeforges,
  selectedRunes,
}: RuneTypeCountInput): Record<RuneType, number> {
  return countUniqueRunesByType([
    ...runeforges.flatMap((forge) => forge.runes),
    ...selectedRunes,
  ]);
}

export function countUniqueRunesByType(runes: Rune[]): Record<RuneType, number> {
  const counts = RUNE_TYPES.reduce(
    (result, runeType) => ({
      ...result,
      [runeType]: 0,
    }),
    {} as Record<RuneType, number>
  );
  const countedIds = new Set<string>();

  const countRune = (rune: Rune) => {
    if (countedIds.has(rune.id)) {
      return;
    }
    counts[rune.runeType] = (counts[rune.runeType] ?? 0) + 1;
    countedIds.add(rune.id);
  };

  runes.forEach(countRune);

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
