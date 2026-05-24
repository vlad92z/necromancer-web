/**
 * Shared rune rarity ordering and disenchant reward helpers.
 */

import type { Rune, RuneEffectRarity } from '../types/game';

export const RUNE_RARITY_SORT_RANK: Record<RuneEffectRarity, number> = {
  epic: 0,
  rare: 1,
  uncommon: 2,
  common: 3,
};

export const RUNE_RARITY_DUST_REWARD: Record<RuneEffectRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 5,
  epic: 25,
};

export function compareRunesByRarityThenId(a: Rune, b: Rune): number {
  const rarityDelta = RUNE_RARITY_SORT_RANK[a.rarity] - RUNE_RARITY_SORT_RANK[b.rarity];

  if (rarityDelta !== 0) {
    return rarityDelta;
  }

  return a.id.localeCompare(b.id);
}

export function getRuneDisenchantDust(rarity: RuneEffectRarity): number {
  return RUNE_RARITY_DUST_REWARD[rarity];
}
