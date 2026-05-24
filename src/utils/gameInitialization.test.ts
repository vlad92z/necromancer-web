import { describe, expect, it } from 'vitest';
import {
  createEmptyWallCharges,
  initializeSoloGame,
  scaleEnemyAttackDamage,
  scaleEnemyMaxHealth,
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

  it('scales enemy max health by 20 percent and rounds up to 5 HP', () => {
    expect([10, 15, 20, 25, 30].map(scaleEnemyMaxHealth)).toEqual([15, 20, 25, 30, 40]);
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
