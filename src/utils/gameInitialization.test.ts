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
    expect(deck.filter((rune) => rune.rarity === 'common')).toHaveLength(25);
    expect(deck.filter((rune) => rune.rarity === 'uncommon')).toHaveLength(5);
    expect(deck.filter((rune) => rune.runeType !== 'Wind').flatMap((rune) => rune.castEffectRefs)).not.toContainEqual(
      expect.objectContaining({ effectId: 'cast.drawType' })
    );
    expect(deck.filter((rune) => rune.runeType === 'Wind').map((rune) => rune.castEffectRefs)).toEqual([
      [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Fire' } }],
      [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Frost' } }],
      [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Lightning' } }],
      [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Void' } }],
      [{ effectId: 'cast.drawType', params: { amount: 1, targetType: 'Life' } }],
    ]);
    expect(deck.find((rune) => rune.id === 'player-1-Fire-2')).toMatchObject({
      rarity: 'uncommon',
      castEffectRefs: [{ effectId: 'cast.damageAdjacent', params: { amount: 1 } }],
      passiveEffectRefs: [],
    });
    expect(deck.find((rune) => rune.id === 'player-1-Life-2')).toMatchObject({
      rarity: 'uncommon',
      castEffectRefs: [{ effectId: 'cast.healthIncrease', params: { amount: 2 } }],
      passiveEffectRefs: [],
    });
    expect(deck.find((rune) => rune.id === 'player-1-Frost-2')).toMatchObject({
      rarity: 'uncommon',
      castEffectRefs: [{ effectId: 'cast.armorAdjacent', params: { amount: 3 } }],
      passiveEffectRefs: [],
    });
    expect(deck.find((rune) => rune.id === 'player-1-Void-2')).toMatchObject({
      rarity: 'uncommon',
      castEffectRefs: [{ effectId: 'cast.damageConsuming', params: { amount: 2 } }],
      passiveEffectRefs: [],
    });
    expect(deck.find((rune) => rune.id === 'player-1-Lightning-2')).toMatchObject({
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.adjacentDamageBoost', params: { amount: 1 } }],
    });
  });

  it('clones the fixed starting deck refs', () => {
    const firstDeck = createStartingDeck();
    const secondDeck = createStartingDeck();

    firstDeck[10].castEffectRefs[0].params = { amount: 99 };

    expect(secondDeck[10].castEffectRefs).toEqual([
      { effectId: 'cast.drawType', params: { amount: 1, targetType: 'Fire' } },
    ]);
    expect(firstDeck[10].castEffectRefs).not.toBe(secondDeck[10].castEffectRefs);
  });

  it('scales enemy max health by 50 percent and rounds up to 1 HP', () => {
    expect([10, 15, 20, 25, 30].map(scaleEnemyMaxHealth)).toEqual([15, 23, 30, 38, 45]);
  });

  it('scales enemy attack by 50 percent and rounds up to 1 damage', () => {
    expect([5, 6, 8, 10].map(scaleEnemyAttackDamage)).toEqual([8, 9, 12, 15]);
  });

  it('creates spell-wall charges with row-based requirements and slot families', () => {
    const wallCharges = createEmptyWallCharges(6);

    expect(wallCharges).toHaveLength(6);
    expect(wallCharges[0]).toHaveLength(6);
    expect(wallCharges[0][0]).toMatchObject({
      row: 0,
      col: 0,
      slotFamily: 'fireVoid',
      lockedRuneType: null,
      requiredCount: 1,
      currentCount: 0,
      spentRunes: [],
      completedRuneId: null,
    });
    expect(wallCharges[2][0]).toMatchObject({
      row: 2,
      col: 0,
      slotFamily: 'lifeFrost',
      requiredCount: 3,
    });
    expect(wallCharges[5][5]).toMatchObject({
      row: 5,
      col: 5,
      slotFamily: 'lightningWind',
      requiredCount: 6,
    });
  });
});
