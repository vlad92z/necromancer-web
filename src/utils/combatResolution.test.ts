import { describe, expect, it } from 'vitest';
import type { Rune } from '../types/game';
import { createEmptyWallCharges, createPlayer } from './gameInitialization';
import { castRuneToWallSlot, endPlayerTurn } from './combatResolution';

describe('combatResolution wall casting', () => {
  it('charges an incomplete matching wall slot without filling the wall', () => {
    const fireRune = createTestRune('fire-charge', 'Fire');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);

    const result = castRuneToWallSlot({
      player,
      hand: [fireRune],
      wallCharges: createEmptyWallCharges(6),
      selectedHandRuneId: fireRune.id,
      row: 1,
      col: 1,
    });

    expect(result.status).toBe('charged');
    expect(result.hand).toEqual([]);
    expect(result.selectedHandRuneId).toBeNull();
    expect(result.player.wall[1][1].runeType).toBeNull();
    expect(result.wallCharges[1][1]).toMatchObject({
      currentCount: 1,
      requiredCount: 2,
      completedRuneId: null,
    });
    expect(result.wallCharges[1][1].spentRunes.map((rune) => rune.id)).toEqual(['fire-charge']);
  });

  it('fills the wall slot on the final matching charge', () => {
    const firstRune = createTestRune('fire-spent', 'Fire');
    const finalRune = createTestRune('fire-final', 'Fire');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wallCharges = createEmptyWallCharges(6);
    wallCharges[1][1] = {
      ...wallCharges[1][1],
      currentCount: 1,
      spentRunes: [firstRune],
    };

    const result = castRuneToWallSlot({
      player,
      hand: [finalRune],
      wallCharges,
      selectedHandRuneId: finalRune.id,
      row: 1,
      col: 1,
    });

    expect(result.status).toBe('completed');
    expect(result.hand).toEqual([]);
    expect(result.player.wall[1][1]).toEqual({
      runeType: 'Fire',
      effects: finalRune.effects,
    });
    expect(result.wallCharges[1][1]).toMatchObject({
      currentCount: 2,
      completedRuneId: 'fire-final',
    });
    expect(result.wallCharges[1][1].spentRunes.map((rune) => rune.id)).toEqual(['fire-spent']);
  });

  it('rejects wrong-type casts without clearing selection', () => {
    const lifeRune = createTestRune('life-wrong-type', 'Life');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wallCharges = createEmptyWallCharges(6);

    const result = castRuneToWallSlot({
      player,
      hand: [lifeRune],
      wallCharges,
      selectedHandRuneId: lifeRune.id,
      row: 0,
      col: 0,
    });

    expect(result.status).toBe('invalid');
    expect(result.hand).toEqual([lifeRune]);
    expect(result.wallCharges).toBe(wallCharges);
    expect(result.selectedHandRuneId).toBe(lifeRune.id);
  });
});

describe('combatResolution turn cycling', () => {
  it('moves remaining hand to discard before drawing from deck', () => {
    const handRune = createTestRune('hand-1', 'Fire');
    const deckRunes = createRunes('deck', 6);
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = endPlayerTurn({
      player,
      hand: [handRune],
      discardPile: [],
      shuffleRunes: (runes) => runes,
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      'deck-0',
      'deck-1',
      'deck-2',
      'deck-3',
      'deck-4',
      'deck-5',
    ]);
    expect(result.discardPile.map((rune) => rune.id)).toEqual(['hand-1']);
    expect(result.player.deck).toEqual([]);
  });

  it('draws from deck before reshuffling discard when deck is short', () => {
    const deckRunes = createRunes('deck-short', 2);
    const discardRunes = createRunes('discard', 5);
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = endPlayerTurn({
      player,
      hand: [],
      discardPile: discardRunes,
      shuffleRunes: (runes) => runes,
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      'deck-short-0',
      'deck-short-1',
      'discard-0',
      'discard-1',
      'discard-2',
      'discard-3',
    ]);
    expect(result.player.deck.map((rune) => rune.id)).toEqual(['discard-4']);
    expect(result.discardPile).toEqual([]);
  });

  it('does not reshuffle discard when deck can fill the hand', () => {
    const deckRunes = createRunes('deck-full', 8);
    const discardRunes = createRunes('discard-kept', 2);
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = endPlayerTurn({
      player,
      hand: [],
      discardPile: discardRunes,
      shuffleRunes: (runes) => [...runes].reverse(),
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      'deck-full-0',
      'deck-full-1',
      'deck-full-2',
      'deck-full-3',
      'deck-full-4',
      'deck-full-5',
    ]);
    expect(result.player.deck.map((rune) => rune.id)).toEqual(['deck-full-6', 'deck-full-7']);
    expect(result.discardPile).toEqual(discardRunes);
  });

  it('supports partial and empty hands when no cards are available', () => {
    const partialDeck = createRunes('partial', 2);
    const partialPlayer = createPlayer('player-1', 'Tester', 10, partialDeck, 10);
    const emptyPlayer = createPlayer('player-1', 'Tester', 10, [], 10);

    const partialResult = endPlayerTurn({
      player: partialPlayer,
      hand: [],
      discardPile: [],
    });
    const emptyResult = endPlayerTurn({
      player: emptyPlayer,
      hand: [],
      discardPile: [],
    });

    expect(partialResult.hand.map((rune) => rune.id)).toEqual(['partial-0', 'partial-1']);
    expect(partialResult.player.deck).toEqual([]);
    expect(emptyResult.hand).toEqual([]);
    expect(emptyResult.player.deck).toEqual([]);
  });
});

function createTestRune(id: string, runeType: Rune['runeType']): Rune {
  return {
    id,
    runeType,
    effects: [{ type: 'Damage', amount: 1, rarity: 'common' }],
  };
}

function createRunes(prefix: string, count: number): Rune[] {
  return Array.from({ length: count }, (_, index) => createTestRune(`${prefix}-${index}`, 'Fire'));
}
