/**
 * Shared rune rarity ordering helpers.
 */

import type { Rune, RuneEffectRarity } from '../types/game';

export const RUNE_RARITY_SORT_RANK: Record<RuneEffectRarity, number> = {
  epic: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
};

export function compareRunesByRarityThenId(a: Rune, b: Rune): number {
  const rarityDelta = RUNE_RARITY_SORT_RANK[a.rarity] - RUNE_RARITY_SORT_RANK[b.rarity];

  if (rarityDelta !== 0) {
    return rarityDelta;
  }

  return a.id.localeCompare(b.id);
}
