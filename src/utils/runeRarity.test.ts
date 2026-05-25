/**
 * Unit tests for rune rarity ordering.
 */

import { describe, expect, it } from 'vitest';
import type { Rune, RuneEffectRarity, RuneType } from '../types/game';
import { compareRunesByRarityThenId } from './runeRarity';

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

});
