import { describe, expect, it } from 'vitest';
import { createEmptyWallCharges, initializeSoloGame } from './gameInitialization';

describe('gameInitialization combat state', () => {
  it('initializes a goblin encounter using targetScore as enemy health', () => {
    const state = initializeSoloGame(42);

    expect(state.enemy).toMatchObject({
      id: 'goblin',
      name: 'Goblin',
      health: 42,
      maxHealth: 42,
      intent: { type: 'Attack', amount: 5 },
    });
    expect(state.combatPhase).toBe('player-turn');
    expect(state.hand).toEqual([]);
    expect(state.discardPile).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
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
