/**
 * Unit tests for post-victory rune pack drafting helpers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Rune } from '../types/game';
import {
  createDeckDraftState,
  createDraftRuneForRarity,
  mergeDeckWithOffer,
  rollDraftRarity,
} from './deckDrafting';
import { PREDEFINED_RUNE_VARIANTS } from './runeEffects';

describe('deckDrafting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates six one-pick rune packs in rune type order', () => {
    const state = createDeckDraftState('player-1', 3, () => 0.99);

    expect(state.totalPicks).toBe(1);
    expect(state.picksRemaining).toBe(1);
    expect(state.selectedOffer).toBeNull();
    expect(state.offers.map((offer) => offer.runeType)).toEqual([
      'Fire',
      'Life',
      'Wind',
      'Frost',
      'Void',
      'Lightning',
    ]);
  });

  it('creates three same-type runes per pack with unique ids and valid effect refs', () => {
    const state = createDeckDraftState('player-1', 0, () => 0.99);
    const runes = state.offers.flatMap((offer) => offer.runes);
    const ids = new Set(runes.map((rune) => rune.id));

    expect(ids.size).toBe(runes.length);
    state.offers.forEach((offer) => {
      expect(offer.runes).toHaveLength(3);
      expect(offer.runes.every((rune) => rune.runeType === offer.runeType)).toBe(true);
      expect(['uncommon', 'rare', 'epic']).toContain(offer.displayRarity);
    });

    runes.forEach((rune) => {
      expect(['common', 'uncommon', 'rare', 'epic']).toContain(rune.rarity);
      expect(rune.castEffectRefs.length + rune.passiveEffectRefs.length).toBeGreaterThan(0);
      rune.castEffectRefs.forEach((effectRef) => {
        expect(effectRef.params ?? {}).not.toHaveProperty('rarity');
      });
      rune.passiveEffectRefs.forEach((effectRef) => {
        expect(effectRef.params ?? {}).not.toHaveProperty('rarity');
      });
    });
  });

  it('allows common rewards while guaranteeing each pack has one uncommon-or-better rune', () => {
    const state = createDeckDraftState('player-1', 0, () => 0.99);

    state.offers.forEach((offer) => {
      expect(offer.runes[0].rarity).toBe('uncommon');
      expect(offer.runes.some((rune) => rune.rarity !== 'common')).toBe(true);
      expect(offer.runes.some((rune) => rune.rarity === 'common')).toBe(true);
      expect(offer.displayRarity).toBe('uncommon');
    });
  });

  it('rolls rarity with current rare and epic scaling plus uncommon fallback odds', () => {
    expect(rollDraftRarity({ winStreak: 10, random: () => 0.11 })).toBe('rare');
    expect(rollDraftRarity({ winStreak: 10, random: () => 0.65 })).toBe('uncommon');
    expect(rollDraftRarity({ winStreak: 0, random: () => 0.95 })).toBe('common');
    expect(rollDraftRarity({ winStreak: 100, random: () => 0.01 })).toBe('epic');
  });

  it('creates a draft rune for an explicit type and rarity', () => {
    const variants = PREDEFINED_RUNE_VARIANTS.Fire.epic;
    PREDEFINED_RUNE_VARIANTS.Fire.epic = [
      ...variants,
      {
        templateId: 'fire-epic-test-variant',
        runeType: 'Fire',
        rarity: 'epic',
        castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 7 } }],
        passiveEffectRefs: [],
      },
    ];
    const randomValues = [0.1234, 0.75];
    let callIndex = 0;

    try {
      const rune = createDraftRuneForRarity({
        ownerId: 'player-1',
        index: 2,
        rarity: 'epic',
        runeType: 'Fire',
        random: () => randomValues[callIndex++] ?? 0,
      });

      expect(rune).toMatchObject({
        id: 'draft-player-1-Fire-2-4fxc',
        runeType: 'Fire',
        rarity: 'epic',
        castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 7 } }],
        passiveEffectRefs: [],
      });
    } finally {
      PREDEFINED_RUNE_VARIANTS.Fire.epic = variants;
    }
  });

  it('merges selected pack runes onto the deck', () => {
    const deckRune = createRune('deck-rune');
    const rewardRune = createRune('reward-rune');
    const merged = mergeDeckWithOffer([deckRune], {
      id: 'reward-pack',
      ownerId: 'player-1',
      runeType: 'Fire',
      displayRarity: 'common',
      runes: [rewardRune],
    });

    expect(merged.map((rune) => rune.id)).toEqual(['deck-rune', 'reward-rune']);
  });
});

function createRune(id: string): Rune {
  return {
    id,
    runeType: 'Fire',
    rarity: 'common',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 3 } }],
    passiveEffectRefs: [],
  };
}
