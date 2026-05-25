import { describe, expect, it } from 'vitest';
import {
  createStartingDeck,
  createEmptyWallCharges,
  initializeSoloGame,
  scaleEnemyAttackDamage,
  scaleEnemyMaxHealth,
  STARTING_DECK,
} from './gameInitialization';

describe('gameInitialization combat state', () => {
  it('initializes a goblin encounter using enemy max health', () => {
    const state = initializeSoloGame(42, undefined, 9);

    expect(state.enemy).toMatchObject({
      id: 'goblin',
      name: 'Goblin',
      health: 42,
      maxHealth: 42,
      intent: { type: 'Attack', amount: 9 },
    });
    expect(state.enemyAttackDamage).toBe(9);
    expect(state.combatPhase).toBe('player-turn');
    expect(state.hand).toHaveLength(6);
    expect(state.player.deck).toHaveLength(state.fullDeck.length - 6);
    expect(state.discardPile).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
  });

  it('creates the fixed literal starting deck', () => {
    const deck = createStartingDeck();

    expect(deck).toHaveLength(30);
    expect(deck.map((rune) => rune.id)).toEqual(STARTING_DECK.map((rune) => rune.id));
    expect(deck.filter((rune) => rune.runeType === 'Fire')).toHaveLength(5);
    expect(deck.filter((rune) => rune.runeType === 'Life')).toHaveLength(5);
    expect(deck.filter((rune) => rune.runeType === 'Wind')).toHaveLength(5);
    expect(deck.filter((rune) => rune.runeType === 'Frost')).toHaveLength(5);
    expect(deck.filter((rune) => rune.runeType === 'Void')).toHaveLength(5);
    expect(deck.filter((rune) => rune.runeType === 'Lightning')).toHaveLength(5);
    expect(deck.every((rune) => rune.rarity === 'common')).toBe(true);
    expect(deck.find((rune) => rune.id === 'player-1-Void-0')?.castEffectRefs).toEqual([
      { effectId: 'cast.damage', params: { amount: 1 } },
    ]);
  });

  it('clones the fixed starting deck refs', () => {
    const firstDeck = createStartingDeck();
    const secondDeck = createStartingDeck();

    firstDeck[0].castEffectRefs[0].params = { amount: 99 };

    expect(secondDeck[0].castEffectRefs).toEqual([{ effectId: 'cast.damage', params: { amount: 1 } }]);
    expect(firstDeck[0].castEffectRefs).not.toBe(secondDeck[0].castEffectRefs);
  });

  it('scales enemy max health by 20 percent and rounds up to 1 HP', () => {
    expect([10, 15, 20, 25, 30].map(scaleEnemyMaxHealth)).toEqual([12, 18, 24, 30, 36]);
  });

  it('scales enemy attack by 20 percent and rounds up to 1 damage', () => {
    expect([5, 6, 8, 10].map(scaleEnemyAttackDamage)).toEqual([6, 8, 10, 12]);
  });

  it('creates spell-wall charges with row-based requirements and expected rune types', () => {
    const wallCharges = createEmptyWallCharges(6);

    expect(wallCharges).toHaveLength(6);
    expect(wallCharges[0]).toHaveLength(6);
    expect(wallCharges[0][0]).toMatchObject({
      row: 0,
      col: 0,
      runeType: 'Fire',
      requiredCount: 1,
      currentCount: 0,
      spentRunes: [],
      completedRuneId: null,
    });
    expect(wallCharges[2][0]).toMatchObject({
      row: 2,
      col: 0,
      runeType: 'Void',
      requiredCount: 3,
    });
    expect(wallCharges[5][5]).toMatchObject({
      row: 5,
      col: 5,
      runeType: 'Fire',
      requiredCount: 6,
    });
  });
});
