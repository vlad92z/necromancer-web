import { describe, expect, it } from 'vitest';
import type { Rune } from '../types/game';
import { createEmptyWallCharges, createPlayer } from './gameInitialization';
import { castRuneToWallSlot } from './combatResolution';

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

function createTestRune(id: string, runeType: Rune['runeType']): Rune {
  return {
    id,
    runeType,
    effects: [{ type: 'Damage', amount: 1, rarity: 'common' }],
  };
}
