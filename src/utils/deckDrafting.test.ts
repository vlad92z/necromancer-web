import { describe, expect, it } from 'vitest';
import type { Rune } from '../types/game';
import { createGoblinEnemy } from './gameInitialization';
import { createDeckDraftState, mergeDeckWithOffer } from './deckDrafting';

describe('deckDrafting', () => {
  it('creates three unique Goblin-drop cards from the Goblin reward pool', () => {
    const state = createDeckDraftState('player-1', createGoblinEnemy(), () => 0);

    expect(state.offers).toHaveLength(3);
    expect(state.selectedOffer).toBeNull();
    expect(state.offers.map((offer) => offer.rune.name)).toEqual(['Throw Rock', 'Hide', 'Scorch']);
    expect(new Set(state.offers.map((offer) => offer.rune.name)).size).toBe(3);
  });

  it('creates reward cards with their specified effects, costs, and artwork', () => {
    const state = createDeckDraftState('player-1', createGoblinEnemy(), () => 0.99);
    const cards = new Map(state.offers.map((offer) => [offer.rune.name, offer.rune]));

    expect(cards.get('Heal')).toMatchObject({
      manaCost: 5,
      castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 5 } }],
    });
    expect(cards.get('Hide')).toMatchObject({
      manaCost: 0,
      castEffectRefs: [{
        effectId: 'rune.consume',
        trigger: 'onCast',
        selection: 'manual',
        payload: { effectId: 'cast.armor', params: { amount: 3 } },
      }],
    });
    expect(cards.get('Scorch')).toMatchObject({
      manaCost: 3,
      cardImageSrc: expect.stringContaining('card_scorch.png'),
      castEffectRefs: [{
        effectId: 'rune.consume',
        trigger: 'onCast',
        selection: 'manual',
        payload: { effectId: 'cast.damage', params: { amount: 5 } },
      }],
    });
  });

  it('does not create offers for an enemy without a reward pool', () => {
    expect(createDeckDraftState('player-1', null).offers).toEqual([]);
  });

  it('merges only the selected card onto the deck', () => {
    const deckRune = createRune('deck-rune');
    const rewardOffer = createDeckDraftState('player-1', createGoblinEnemy(), () => 0).offers[0]!;

    expect(mergeDeckWithOffer([deckRune], rewardOffer).map((rune) => rune.id)).toEqual([
      'deck-rune',
      rewardOffer.rune.id,
    ]);
  });
});

function createRune(id: string): Rune {
  return {
    id,
    name: 'Fire Test',
    runeTypes: ['Fire'],
    rarity: 'common',
    cardImageSrc: 'fire-card.png',
    tokenImageSrc: 'fire-token.png',
    castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 3 } }],
    passiveEffectRefs: [],
  };
}
