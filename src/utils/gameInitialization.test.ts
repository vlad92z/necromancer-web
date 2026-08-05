import { describe, expect, it } from 'vitest';
import {
  createStartingDeck,
  initializeSoloGame,
  rollEnemyArcaneDustReward,
  STARTING_DECK,
} from './gameInitialization';
import { MONSTER_CATALOG } from './monsterCatalog';
import { getRuneEffectDescription } from './runeEffects';

describe('gameInitialization combat state', () => {
  it('initializes a Goblin encounter from the monster catalogue', () => {
    const state = initializeSoloGame();

    expect(state.enemy).toMatchObject({
      id: 'goblin',
      name: 'Goblin',
      health: MONSTER_CATALOG.goblin.maxHealth,
      maxHealth: MONSTER_CATALOG.goblin.maxHealth,
    });
    expect(state.combatPhase).toBe('player-turn');
    expect(state.hand).toHaveLength(5);
    expect(state.player.deck).toHaveLength(state.fullDeck.length - 5);
    expect(state.player).toMatchObject({ mana: 7, maxMana: 7 });
    expect(state.discardPile).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
  });

  it('initializes empty player and enemy destroyed rune histories', () => {
    const state = initializeSoloGame();

    expect(state.playerDestroyedRunes).toEqual([]);
    expect(state.enemyDestroyedRunes).toEqual([]);
  });

  it('starts the default Goblin encounter at its catalogue health with neutral slots', () => {
    const state = initializeSoloGame();

    expect(state.enemy).toMatchObject({
      health: MONSTER_CATALOG.goblin.maxHealth,
      maxHealth: MONSTER_CATALOG.goblin.maxHealth,
    });
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
      passiveEffectRefs: [{
        effectId: 'rune.destroy',
        trigger: 'onIncomingDamage',
        selection: 'random',
        targetOwner: 'self',
        count: 1,
        runeType: 'Wind',
        payload: { effectId: 'passive.reduceDamage', params: { amount: 5 } },
      }],
    });
    expect(getRuneEffectDescription(deck.find((rune) => rune.name === 'Headwind')!)).toBe(
      '• Destroy a random Wind rune on your wall to reduce incoming damage by 5',
    );
    expect(deck.find((rune) => rune.name === 'Lightning Bolt')).toMatchObject({ manaCost: 1 });
    expect(deck.find((rune) => rune.name === 'Firebolt')).toMatchObject({ manaCost: 2 });
    expect(deck.find((rune) => rune.name === 'Frost Shield')).toMatchObject({
      manaCost: 2,
      castEffectRefs: [{ effectId: 'cast.shield', params: { amount: 3 } }],
    });
    expect(deck.find((rune) => rune.name === 'Void Tendrils')).toMatchObject({ manaCost: 5 });
  });

  it('assigns the requested art and effects to starting cards', () => {
    const deck = createStartingDeck();

    expect(deck.find((rune) => rune.name === 'Barricade')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.shield', params: { amount: 5 } }],
    });
    expect(deck.find((rune) => rune.name === 'Barricade')?.cardImageSrc).toContain('card_barricade.png');
    expect(deck.find((rune) => rune.name === 'Headwind')?.cardImageSrc).toContain('card_headwind.png');
    expect(
      deck
        .filter((rune) => ['Firebolt', 'Lightning Bolt', 'Tornado', 'Void Tendrils'].includes(rune.name))
        .every((rune) => rune.castEffectRefs[0]?.effectId === 'cast.damage'
          && rune.castEffectRefs[0]?.params?.amount === (rune.name === 'Lightning Bolt' ? 2 : rune.name === 'Void Tendrils' ? 10 : rune.name === 'Firebolt' ? 1 : 5))
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
    const firstHeadwindEffect = firstDeck.find((rune) => rune.name === 'Headwind')!.passiveEffectRefs[0];
    const secondHeadwindEffect = secondDeck.find((rune) => rune.name === 'Headwind')!.passiveEffectRefs[0];
    expect(firstHeadwindEffect).not.toBe(secondHeadwindEffect);
    expect('payload' in firstHeadwindEffect && 'payload' in secondHeadwindEffect
      ? firstHeadwindEffect.payload
      : null).not.toBe(
      'payload' in secondHeadwindEffect ? secondHeadwindEffect.payload : null,
    );
  });

  it('assigns current type card and token art to every starting rune', () => {
    const deck = createStartingDeck();
    const fireRunes = deck.filter((rune) => rune.runeTypes[0] === 'Fire');

    expect(deck.every((rune) => rune.cardImageSrc && rune.tokenImageSrc)).toBe(true);
    expect(new Set(fireRunes.map((rune) => rune.tokenImageSrc)).size).toBe(1);
    expect(new Set(fireRunes.map((rune) => rune.cardImageSrc)).size).toBe(1);
  });

});
