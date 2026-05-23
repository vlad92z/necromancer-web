/**
 * Unit tests for pure cast effect resolution.
 */

import { describe, expect, it } from 'vitest';
import type { EffectRef, Enemy, Player, Rune, RuneType, ScoringWall, WallCell } from '../types/game';
import { createEffectRef, EFFECT_CATALOG } from './effectCatalog';
import { collectActivePassiveEffects, resolveCastEffects, resolvePassiveEffects } from './effectResolver';
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

describe('effectResolver passive effects', () => {
  it('collects wall rune passives and selected artefact passives in stable source order', () => {
    const wall = createEmptyWall(6);
    wall[1][2] = createWallCell('Fire', [createEffectRef('passive.tomeCastDamage', { damageBonus: 1 })]);
    wall[0][5] = createWallCell('Frost', [createEffectRef('passive.potionArmor', { armorMultiplier: 3 })]);

    const passives = collectActivePassiveEffects({ wall, activeArtefacts: ['rod', 'robe'] });

    expect(passives.map((passive) => ({
      sourceType: passive.sourceType,
      sourceId: passive.sourceId,
      effectId: passive.effectRef.effectId,
      sourceOrder: passive.sourceOrder,
    }))).toEqual([
      { sourceType: 'rune', sourceId: 'wall:0:5', effectId: 'passive.potionArmor', sourceOrder: 5 },
      { sourceType: 'rune', sourceId: 'wall:1:2', effectId: 'passive.tomeCastDamage', sourceOrder: 8 },
      { sourceType: 'artefact', sourceId: 'rod', effectId: 'passive.rodHealing', sourceOrder: 0 },
      { sourceType: 'artefact', sourceId: 'robe', effectId: 'passive.robeDraftSelection', sourceOrder: 1 },
    ]);
  });

  it('filters passives by supported trigger and leaves unmatched triggers unchanged', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [createEffectRef('passive.tomeCastDamage', { damageBonus: 2 })]);
    const baseValues = {
      damage: 10,
      healing: 5,
      armor: 4,
      epicChance: 3,
      selectionLimit: 1,
    };

    const onCast = resolvePassiveEffects({
      trigger: 'onCast',
      wall,
      activeArtefacts: ['rod', 'potion', 'ring', 'robe'],
      baseValues,
    });
    expect(onCast.values).toEqual({
      damage: 12,
      healing: 10,
      armor: 8,
      epicChance: 3,
      selectionLimit: 1,
    });
    expect(onCast.logs.map((log) => log.effectId)).toEqual([
      'passive.tomeCastDamage',
      'passive.rodHealing',
      'passive.potionArmor',
    ]);

    const onDeckDraftOffer = resolvePassiveEffects({
      trigger: 'onDeckDraftOffer',
      wall,
      activeArtefacts: ['rod', 'potion', 'ring', 'robe'],
      baseValues,
    });
    expect(onDeckDraftOffer.values).toEqual({
      damage: 10,
      healing: 5,
      armor: 4,
      epicChance: 6,
      selectionLimit: 2,
    });
    expect(onDeckDraftOffer.logs.map((log) => log.effectId)).toEqual([
      'passive.robeDraftSelection',
      'passive.ringDraftRarity',
    ]);

    (['onEnemyAttack', 'startTurn', 'endTurn'] as const).forEach((trigger) => {
      const result = resolvePassiveEffects({
        trigger,
        wall,
        activeArtefacts: ['rod', 'potion', 'ring', 'robe'],
        baseValues,
      });
      expect(result.values).toEqual(baseValues);
      expect(result.logs).toEqual([]);
    });
  });

  it('orders by source type, priority, flat before multiplier, and stable source order', () => {
    const tomeMetadata = EFFECT_CATALOG['passive.tomeCastDamage'].passive;
    const rodMetadata = EFFECT_CATALOG['passive.rodHealing'].passive;
    if (!tomeMetadata || !rodMetadata) {
      throw new Error('Expected passive metadata for test');
    }
    const originalTomeMetadata = { ...tomeMetadata };
    const originalRodMetadata = { ...rodMetadata };

    try {
      EFFECT_CATALOG['passive.tomeCastDamage'].passive = {
        ...tomeMetadata,
        target: 'damage',
        stacking: 'flat',
        paramKey: 'damageBonus',
        priority: 1,
      };
      EFFECT_CATALOG['passive.rodHealing'].passive = {
        ...rodMetadata,
        target: 'damage',
        stacking: 'multiplier',
        paramKey: 'healingMultiplier',
        priority: 1,
      };

      const wall = createEmptyWall(6);
      wall[0][1] = createWallCell('Fire', [createEffectRef('passive.tomeCastDamage', { damageBonus: 3 })]);
      wall[0][0] = createWallCell('Life', [createEffectRef('passive.rodHealing', { healingMultiplier: 2 })]);

      const result = resolvePassiveEffects({
        trigger: 'onCast',
        wall,
        activeArtefacts: ['rod'],
        baseValues: { damage: 10 },
      });

      expect(result.values.damage).toBe(52);
      expect(result.logs.map((log) => `${log.sourceId}:${log.effectId}:${log.output.stacking}`)).toEqual([
        'wall:0:1:passive.tomeCastDamage:flat',
        'wall:0:0:passive.rodHealing:multiplier',
        'rod:passive.rodHealing:multiplier',
      ]);
    } finally {
      EFFECT_CATALOG['passive.tomeCastDamage'].passive = originalTomeMetadata;
      EFFECT_CATALOG['passive.rodHealing'].passive = originalRodMetadata;
    }
  });

  it('logs unknown or missing passive metadata as no-ops without throwing', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [
      { effectId: 'unknown.passive', params: { amount: 99 } },
      createEffectRef('cast.damage', { amount: 99 }),
    ]);

    const result = resolvePassiveEffects({
      trigger: 'onCast',
      wall,
      activeArtefacts: [],
      baseValues: { damage: 3 },
    });

    expect(result.values).toEqual({ damage: 3 });
    expect(result.logs).toMatchObject([
      {
        sourceType: 'rune',
        sourceId: 'wall:0:0',
        effectId: 'unknown.passive',
        trigger: 'onCast',
        displayHint: 'unknown',
        output: { noOp: true },
      },
      {
        sourceType: 'rune',
        sourceId: 'wall:0:0',
        effectId: 'cast.damage',
        trigger: 'onCast',
        displayHint: 'damage',
        output: { noOp: true },
      },
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

function createWallCell(runeType: RuneType, passiveEffectRefs: EffectRef[] = []): WallCell {
  return {
    runeType,
    rarity: 'common',
    castEffectRefs: [],
    passiveEffectRefs,
  };
}
