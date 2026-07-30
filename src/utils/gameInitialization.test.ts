import { describe, expect, it } from 'vitest';
import {
  createStartingDeck,
  initializeSoloGame,
  scaleEnemyMaxHealth,
  STARTING_DECK,
} from './gameInitialization';

describe('gameInitialization combat state', () => {
  it('initializes a goblin encounter using enemy max health', () => {
    const state = initializeSoloGame(42);

    expect(state.enemy).toMatchObject({
      id: 'goblin',
      name: 'Goblin',
      health: 42,
      maxHealth: 42,
    });
    expect(state.combatPhase).toBe('player-turn');
    expect(state.hand).toHaveLength(6);
    expect(state.player.deck).toHaveLength(state.fullDeck.length - 6);
    expect(state.discardPile).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
  });

  it('starts the default Goblin encounter at 25 health', () => {
    const state = initializeSoloGame();

    expect(state.enemy).toMatchObject({ health: 25, maxHealth: 25 });
    expect(state.enemyBoard.flat().every((cell) => (
      cell.acceptedRuneTypes.length === 1 && cell.acceptedRuneTypes[0] === 'Life'
    ))).toBe(true);
  });

  it('creates the fixed literal starting deck', () => {
    const deck = createStartingDeck();

    expect(deck).toHaveLength(12);
    expect(deck.map((rune) => rune.id)).toEqual(STARTING_DECK.map((rune) => rune.id));
    expect(deck.filter((rune) => rune.rarity === 'common')).toHaveLength(11);
    expect(deck.filter((rune) => rune.rarity === 'uncommon')).toHaveLength(1);
    expect(deck.map((rune) => rune.name).sort()).toEqual([
      'Barricade',
      'Barricade',
      'Firebolt',
      'Firebolt',
      'Frost Shield',
      'Frost Shield',
      'Headwind',
      'Lightning Bolt',
      'Lightning Bolt',
      'Tornado',
      'Void Tendrils',
      'Void Tendrils',
    ].sort());
    expect(deck.find((rune) => rune.name === 'Headwind')).toMatchObject({
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.reduceDamage', params: { amount: 1 } }],
    });
  });

  it('assigns the requested art and effects to starting cards', () => {
    const deck = createStartingDeck();

    expect(deck.find((rune) => rune.name === 'Barricade')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 5 } }],
    });
    expect(deck.find((rune) => rune.name === 'Barricade')?.cardImageSrc).toContain('card_barricade.png');
    expect(deck.find((rune) => rune.name === 'Headwind')?.cardImageSrc).toContain('card_headwind.png');
    expect(
      deck
        .filter((rune) => ['Firebolt', 'Lightning Bolt', 'Tornado', 'Void Tendrils'].includes(rune.name))
        .every((rune) => rune.castEffectRefs[0]?.effectId === 'cast.damage'
          && rune.castEffectRefs[0]?.params?.amount === 5)
    ).toBe(true);
  });

  it('clones the fixed starting deck refs', () => {
    const firstDeck = createStartingDeck();
    const secondDeck = createStartingDeck();

    firstDeck[0].castEffectRefs[0].params = { amount: 99 };

    expect(secondDeck[0].castEffectRefs).toEqual([
      { effectId: 'cast.damage', params: { amount: 5 } },
    ]);
    expect(firstDeck[0].castEffectRefs).not.toBe(secondDeck[0].castEffectRefs);
  });

  it('assigns current type card and token art to every starting rune', () => {
    const deck = createStartingDeck();
    const fireRunes = deck.filter((rune) => rune.runeTypes[0] === 'Fire');

    expect(deck.every((rune) => rune.cardImageSrc && rune.tokenImageSrc)).toBe(true);
    expect(new Set(fireRunes.map((rune) => rune.tokenImageSrc)).size).toBe(1);
    expect(new Set(fireRunes.map((rune) => rune.cardImageSrc)).size).toBe(1);
  });

  it('scales enemy max health by the configured multiplier and rounds up to 1 HP', () => {
    expect([10, 15, 20, 25, 30].map(scaleEnemyMaxHealth)).toEqual([14, 21, 27, 34, 41]);
  });

});
