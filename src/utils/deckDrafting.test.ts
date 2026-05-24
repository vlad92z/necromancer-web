/**
 * Unit tests for post-victory deck drafting helpers.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Player, Rune } from '../types/game';
import {
  advanceDeckDraftState,
  applyDeckDraftEffectToPlayer,
  createDeckDraftState,
  createDraftRuneForRarity,
  getDeckDraftEffectDescription,
  getDeckDraftSelectionLimit,
  mergeDeckWithRuneforge,
  resolveDeckDraftOfferPassives,
  rollDraftRarity,
} from './deckDrafting';

describe('deckDrafting', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a one-pick draft offer with three reward rows', () => {
    const state = createDeckDraftState('player-1', 3, [], 1);

    expect(state.totalPicks).toBe(1);
    expect(state.picksRemaining).toBe(1);
    expect(state.selectionLimit).toBe(1);
    expect(state.selectionsThisOffer).toBe(0);
    expect(state.runeforges).toHaveLength(3);
    state.runeforges.forEach((forge) => {
      expect(forge.ownerId).toBe('player-1');
      expect(forge.runes).toHaveLength(4);
      expect(forge.disabled).toBe(false);
      expect(forge.deckDraftEffect).toBeDefined();
    });
  });

  it('stores the caller-provided selection limit for multi-select rewards', () => {
    const state = createDeckDraftState('player-1', 3, ['robe'], 2);

    expect(state.totalPicks).toBe(1);
    expect(state.picksRemaining).toBe(1);
    expect(state.selectionLimit).toBe(2);
  });

  it('generates runes with unique ids and rarity fields', () => {
    const state = createDeckDraftState('player-1', 0, [], 1);
    const runes = state.runeforges.flatMap((forge) => forge.runes);
    const ids = new Set(runes.map((rune) => rune.id));

    expect(ids.size).toBe(runes.length);
    runes.forEach((rune) => {
      expect(['common', 'uncommon', 'rare', 'epic']).toContain(rune.rarity);
      expect(rune.castEffectRefs.length).toBeGreaterThan(0);
      expect(rune.passiveEffectRefs).toEqual([]);
      rune.castEffectRefs.forEach((effectRef) => {
        expect(effectRef.params).not.toHaveProperty('rarity');
      });
    });
  });

  it('applies Ring rarity modifier while keeping valid draft runes', () => {
    const randomValues = [0.001, 0.02, 0.4, 0.8];
    let callIndex = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      const value = randomValues[callIndex % randomValues.length];
      callIndex += 1;
      return value;
    });

    const state = createDeckDraftState('player-1', 10, ['ring'], 1);
    const runes = state.runeforges.flatMap((forge) => forge.runes);

    expect(runes.length).toBe(12);
    expect(runes.some((rune) => rune.rarity === 'epic')).toBe(true);
  });

  it('resolves Ring and Robe through deck draft offer passives', () => {
    expect(resolveDeckDraftOfferPassives([], {
      epicChance: 10,
      rareChance: 20,
      selectionLimit: 1,
    })).toEqual({
      epicChance: 10,
      rareChance: 20,
      selectionLimit: 1,
    });

    expect(resolveDeckDraftOfferPassives(['ring', 'robe'], {
      epicChance: 10,
      rareChance: 20,
      selectionLimit: 1,
    })).toEqual({
      epicChance: 20,
      rareChance: 20,
      selectionLimit: 2,
    });

    expect(resolveDeckDraftOfferPassives(['ring', 'robe'], {
      epicChance: 60,
      rareChance: 20,
      selectionLimit: 3,
    })).toEqual({
      epicChance: 100,
      rareChance: 0,
      selectionLimit: 3,
    });
  });

  it('resolves deck draft selection limit through Robe passives', () => {
    expect(getDeckDraftSelectionLimit([])).toBe(1);
    expect(getDeckDraftSelectionLimit(['robe'])).toBe(2);
    expect(getDeckDraftSelectionLimit(['robe', 'ring', 'rod', 'potion', 'tome'])).toBe(2);
  });

  it('rolls rarity before creating a draft rune for that rarity', () => {
    expect(rollDraftRarity({ winStreak: 10, activeArtefacts: ['ring'], random: () => 0.17 })).toBe('epic');
    expect(rollDraftRarity({ winStreak: 10, activeArtefacts: [], random: () => 0.1 })).toBe('rare');
    expect(rollDraftRarity({ winStreak: 0, activeArtefacts: [], random: () => 0.99 })).toBe('uncommon');

    const rune = createDraftRuneForRarity({
      ownerId: 'player-1',
      index: 0,
      rarity: 'epic',
      runeTypes: ['Fire'],
      random: () => 0,
    });

    expect(rune.rarity).toBe('epic');
    expect(rune.runeType).toBe('Fire');
    expect(rune.castEffectRefs.length).toBeGreaterThan(0);
  });

  it('boosts the already-rolled rarity for Better Runes reward rows', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const state = createDeckDraftState('player-1', 1, [], 1);

    expect(state.runeforges[2].deckDraftEffect).toEqual({ type: 'betterRunes', rarityStep: 1 });
    expect(state.runeforges[2].runes[0].rarity).toBe('rare');
    expect(state.runeforges[2].runes.slice(1).every((rune) => rune.rarity === 'uncommon')).toBe(true);
  });

  it('keeps Ring and Robe draft runes on the catalog-ref shape', () => {
    const state = createDeckDraftState('player-1', 10, ['ring', 'robe'], 2);
    const runes = state.runeforges.flatMap((forge) => forge.runes);

    expect(state.selectionLimit).toBe(2);
    runes.forEach((rune) => {
      expect(['common', 'uncommon', 'rare', 'epic']).toContain(rune.rarity);
      expect(rune.castEffectRefs.length).toBeGreaterThan(0);
      expect(rune.passiveEffectRefs).toEqual([]);
      rune.castEffectRefs.forEach((effectRef) => {
        expect(effectRef.params).not.toHaveProperty('rarity');
      });
    });
  });

  it('advances to null after the single draft pick is consumed', () => {
    const state = createDeckDraftState('player-1', 3, [], 1);

    expect(advanceDeckDraftState(state, 'player-1', 3, [])).toBeNull();
  });

  it('merges selected reward runes onto the deck', () => {
    const deckRune = createRune('deck-rune');
    const rewardRune = createRune('reward-rune');
    const merged = mergeDeckWithRuneforge([deckRune], {
      id: 'reward-row',
      ownerId: 'player-1',
      runes: [rewardRune],
      disabled: false,
    });

    expect(merged.map((rune) => rune.id)).toEqual(['deck-rune', 'reward-rune']);
  });

  it('applies deck draft effects to the player', () => {
    const player = createPlayer();

    expect(applyDeckDraftEffectToPlayer({ ...player, health: 20 }, { type: 'heal', amount: 50 }, 100).health).toBe(100);
    expect(applyDeckDraftEffectToPlayer(player, { type: 'maxHealth', amount: 25 }, 100)).toMatchObject({
      maxHealth: 125,
      health: 80,
    });
    expect(applyDeckDraftEffectToPlayer(player, { type: 'betterRunes', rarityStep: 1 }, 100)).toBe(player);
  });

  it('returns current deck draft effect descriptions', () => {
    expect(getDeckDraftEffectDescription({ type: 'heal', amount: 50 })).toBe('Restore Health');
    expect(getDeckDraftEffectDescription({ type: 'maxHealth', amount: 25 })).toBe('+25 Max health');
    expect(getDeckDraftEffectDescription({ type: 'betterRunes', rarityStep: 1 })).toBe('Better Runes');
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

function createPlayer(): Player {
  return {
    id: 'player-1',
    name: 'Tester',
    patternLines: [],
    wall: [],
    health: 80,
    maxHealth: 100,
    armor: 0,
    deck: [],
  };
}
