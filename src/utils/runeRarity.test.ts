/**
 * Unit tests for rune rarity ordering and disenchant rewards.
 */

import { describe, expect, it } from 'vitest';
import type { Rune, RuneEffectRarity, RuneType } from '../types/game';
import { compareRunesByRarityThenId, getRuneDisenchantDust } from './runeRarity';

function createRune(id: string, rarity: RuneEffectRarity, castRefCount = 0): Rune {
  return {
    id,
    runeType: 'Fire' as RuneType,
    rarity,
    castEffectRefs: Array.from({ length: castRefCount }, (_, index) => ({
      effectId: `test.effect.${index}`,
    })),
    passiveEffectRefs: [],
  };
}

describe('runeRarity', () => {
  it('sorts by direct rune rarity before id without using effect refs', () => {
    const runes = [
      createRune('common-with-ref', 'common', 1),
      createRune('rare-b', 'rare'),
      createRune('epic-a', 'epic'),
      createRune('rare-a', 'rare'),
      createRune('uncommon-a', 'uncommon'),
    ];

    expect([...runes].sort(compareRunesByRarityThenId).map((rune) => rune.id)).toEqual([
      'epic-a',
      'rare-a',
      'rare-b',
      'uncommon-a',
      'common-with-ref',
    ]);
  });

  it('returns disenchant dust from direct rune rarity values', () => {
    expect(getRuneDisenchantDust('common')).toBe(0);
    expect(getRuneDisenchantDust('uncommon')).toBe(1);
    expect(getRuneDisenchantDust('rare')).toBe(5);
    expect(getRuneDisenchantDust('epic')).toBe(25);
  });
});
