import { describe, expect, it } from 'vitest';
import {
  createStartingDeck,
  initializeSoloGame,
  rollEnemyArcaneDustReward,
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
    expect(state.hand).toHaveLength(5);
    expect(state.player.deck).toHaveLength(state.fullDeck.length - 5);
    expect(state.player).toMatchObject({ mana: 7, maxMana: 7 });
    expect(state.discardPile).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
  });

  it('starts the default Goblin encounter at 20 health with neutral slots', () => {
    const state = initializeSoloGame();

    expect(state.enemy).toMatchObject({ health: 20, maxHealth: 20 });
    expect(state.enemyBoard.flat().every((cell) => cell.id === null && cell.runeTypes.length === 0)).toBe(true);
    expect(state.arcaneDust).toBe(0);
  });

  it('rolls the Goblin encounter reward within its configured Arcane Dust range', () => {
    const enemy = initializeSoloGame().enemy;

    expect(enemy?.arcaneDustRewardRange).toEqual([4, 7]);
    expect(rollEnemyArcaneDustReward(enemy, () => 0)).toBe(4);
    expect(rollEnemyArcaneDustReward(enemy, () => 0.9999)).toBe(7);
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
      manaCost: 4,
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.reduceDamage', params: { amount: 1 } }],
    });
    expect(deck.find((rune) => rune.name === 'Lightning Bolt')).toMatchObject({ manaCost: 1 });
    expect(deck.find((rune) => rune.name === 'Firebolt')).toMatchObject({ manaCost: 2 });
    expect(deck.find((rune) => rune.name === 'Void Tendrils')).toMatchObject({ manaCost: 5 });
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
          && rune.castEffectRefs[0]?.params?.amount === (rune.name === 'Lightning Bolt' ? 2 : rune.name === 'Void Tendrils' ? 10 : 5))
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

});
