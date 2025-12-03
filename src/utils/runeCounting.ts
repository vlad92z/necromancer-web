/**
 * Rune counting helpers for drafting UI
 */

import type { GameState, Rune, RuneType, Runeforge } from '../types/game';

interface RuneTypeCountInput {
  runeforges: Runeforge[];
  centerPool: Rune[];
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
}

export function getRuneTypeCounts({
  runeforges,
  centerPool,
  selectedRunes,
  draftSource,
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
  const relevantRuneforges = runeforges;
  const selectionFromCenter = draftSource?.type === 'center';
  const centerRunesForCount =
    selectionFromCenter && draftSource?.originalRunes ? draftSource.originalRunes : centerPool;

  const countRune = (rune: Rune) => {
    if (countedIds.has(rune.id)) {
      return;
    }
    counts[rune.runeType] = (counts[rune.runeType] ?? 0) + 1;
    countedIds.add(rune.id);
  };

  relevantRuneforges.forEach((forge) => {
    const forgeRunes =
      draftSource?.type === 'runeforge' &&
      draftSource.runeforgeId === forge.id &&
      draftSource.originalRunes.length > 0
        ? draftSource.originalRunes
        : forge.runes;

    forgeRunes.forEach(countRune);
  });

  centerRunesForCount.forEach(countRune);
  selectedRunes.forEach(countRune);

  return counts;
}
