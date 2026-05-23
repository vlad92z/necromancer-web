/**
 * Unit tests for pure cast effect resolution.
 */

import { describe, expect, it } from 'vitest';
import type { Enemy, Player, Rune, RuneType, ScoringWall, WallCell } from '../types/game';
import { createEffectRef } from './effectCatalog';
import { resolveCastEffects } from './effectResolver';
import { createEmptyWall, createPlayer } from './gameInitialization';

describe('effectResolver resolveCastEffects', () => {
  it('resolves damage, healing, armor, and fortune in ref order', () => {
    const player = { ...createTestPlayer(), health: 8, armor: 1 };
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('mixed-cast', 'Fire', [
      createEffectRef('cast.damage', { amount: 3 }),
      createEffectRef('cast.healing', { amount: 5 }),
      createEffectRef('cast.armor', { amount: 2 }),
      createEffectRef('cast.fortune', { amount: 4 }),
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.enemy?.health).toBe(17);
    expect(result.player.health).toBe(10);
    expect(result.player.armor).toBe(3);
    expect(result.arcaneDustDelta).toBe(4);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'cast.damage',
      'cast.healing',
      'cast.armor',
      'cast.fortune',
    ]);
  });

  it('resolves synergy and fragile against the whole completed wall', () => {
    const player = createTestPlayer([
      [0, 4, 'Void'],
      [1, 4, 'Void'],
      [2, 0, 'Fire'],
    ]);
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('void-cast', 'Void', [
      createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' }),
      createEffectRef('cast.fragile', { amount: 5, fragileType: 'Life' }),
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.enemy?.health).toBe(11);
    expect(result.logs).toMatchObject([
      { effectId: 'cast.synergy', output: { damage: 4, synergyCount: 2 } },
      { effectId: 'cast.fragile', output: { damage: 5, isBlocked: false } },
    ]);
  });

  it('keeps channel and unknown refs as no-op logs', () => {
    const player = createTestPlayer();
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('channel-cast', 'Lightning', [
      createEffectRef('cast.channelSynergy', { amount: 4, synergyType: 'Lightning' }),
      { effectId: 'passive.tomeCastDamage', params: { damageBonus: 1 } },
      { effectId: 'unknown.effect', params: { amount: 99 } },
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.player).toBe(player);
    expect(result.enemy).toBe(enemy);
    expect(result.arcaneDustDelta).toBe(0);
    expect(result.logs).toMatchObject([
      { effectId: 'cast.channelSynergy', displayHint: 'channel', output: { noOp: true } },
      { effectId: 'passive.tomeCastDamage', displayHint: 'damage', output: { noOp: true } },
      { effectId: 'unknown.effect', displayHint: 'unknown', output: { noOp: true } },
    ]);
  });
});

function createTestPlayer(cells: Array<[number, number, RuneType]> = []): Player {
  const player = createPlayer('player-1', 'Tester', 10, [], 10);
  const wall: ScoringWall = createEmptyWall(6);
  cells.forEach(([row, col, runeType]) => {
    wall[row][col] = createWallCell(runeType);
  });
  return { ...player, wall };
}

function createTestRune(id: string, runeType: RuneType, castEffectRefs: Rune['castEffectRefs']): Rune {
  return {
    id,
    runeType,
    rarity: 'common',
    castEffectRefs,
    passiveEffectRefs: [],
  };
}

function createTestEnemy(health: number): Enemy {
  return {
    id: 'test-enemy',
    name: 'Test Enemy',
    imageSrc: '',
    health,
    maxHealth: 20,
    intent: { type: 'Attack', amount: 5 },
  };
}

function createWallCell(runeType: RuneType): WallCell {
  return {
    runeType,
    rarity: 'common',
    castEffectRefs: [],
    passiveEffectRefs: [],
  };
}
