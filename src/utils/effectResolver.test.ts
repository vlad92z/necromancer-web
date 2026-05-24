/**
 * Unit tests for pure cast effect resolution.
 */

import { describe, expect, it } from 'vitest';
import type { EffectRef, Enemy, Player, Rune, RuneType, ScoringWall, WallCell } from '../types/game';
import { createEffectRef, EFFECT_CATALOG } from './effectCatalog';
import { collectActivePassiveEffects, resolveCastEffects, resolveEndTurnEffects, resolvePassiveEffects } from './effectResolver';
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

  it('resolves adjacent damage with diagonal and orthogonal completed wall runes only', () => {
    const player = createTestPlayer([
      [0, 0, 'Frost'],
      [0, 1, 'Fire'],
      [1, 0, 'Life'],
      [2, 2, 'Void'],
      [3, 3, 'Wind'],
    ]);
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('fire-adjacent', 'Fire', [
      createEffectRef('cast.damageAdjacent', { amount: 2 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(12);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.damageAdjacent',
      output: { damage: 8, adjacentCount: 4 },
    });
  });

  it('does not count partial charge runes for adjacent damage', () => {
    const player = createTestPlayer([
      [0, 0, 'Frost'],
    ]);
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('fire-adjacent-partial', 'Fire', [
      createEffectRef('cast.damageAdjacent', { amount: 3 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(17);
    expect(result.logs[0]).toMatchObject({
      output: { damage: 3, adjacentCount: 1 },
    });
  });

  it('resolves conditional damage from completed wall counts', () => {
    const belowThresholdPlayer = createTestPlayer([[0, 4, 'Void']]);
    const atThresholdPlayer = createTestPlayer([
      [0, 4, 'Void'],
      [1, 4, 'Void'],
    ]);
    const castRune = createTestRune('void-conditional', 'Void', [
      createEffectRef('cast.damageConditional', { amount: 25, threshold: 2, conditionType: 'Void' }),
    ]);

    expect(resolveCastEffects({
      player: belowThresholdPlayer,
      enemy: createTestEnemy(30),
      castRune,
      wall: belowThresholdPlayer.wall,
    }).enemy?.health).toBe(30);
    expect(resolveCastEffects({
      player: atThresholdPlayer,
      enemy: createTestEnemy(30),
      castRune,
      wall: atThresholdPlayer.wall,
    }).enemy?.health).toBe(5);
  });

  it('applies damage boost synergy after flat damage bonuses and rounds positive damage up', () => {
    const player = createTestPlayer([
      [0, 3, 'Frost'],
      [1, 3, 'Frost'],
    ]);
    const wall = player.wall.map((row) => row.map((cell) => ({ ...cell })));
    wall[0][0] = createWallCell('Lightning', [
      createEffectRef('passive.damageBoostSynergy', { percent: 5, synergyType: 'Frost' }),
    ]);
    const playerWithPassive = { ...player, wall };
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('boosted-fire', 'Fire', [
      createEffectRef('cast.damage', { amount: 3 }),
    ]);

    const result = resolveCastEffects({
      player: playerWithPassive,
      enemy,
      castRune,
      wall: playerWithPassive.wall,
      activeArtefacts: ['tome'],
    });

    expect(result.enemy?.health).toBe(15);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'cast.damage',
      'passive.damageBoostSynergy',
      'passive.tomeCastDamage',
    ]);
    expect(result.logs[1]).toMatchObject({
      output: { synergyType: 'Frost', synergyCount: 2, previousValue: 0, nextValue: 10 },
    });
  });

  it('resolves adjacent armor from diagonal and orthogonal completed wall runes', () => {
    const player = createTestPlayer([
      [0, 0, 'Frost'],
      [0, 1, 'Fire'],
      [1, 0, 'Life'],
      [2, 2, 'Void'],
    ]);
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('frost-adjacent', 'Frost', [
      createEffectRef('cast.armorAdjacent', { amount: 3 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.player.armor).toBe(12);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.armorAdjacent',
      output: { armor: 12, adjacentCount: 4 },
    });
  });

  it('resolves health increase into current and maximum health', () => {
    const player = { ...createTestPlayer(), health: 8, maxHealth: 10 };
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('life-increase', 'Life', [
      createEffectRef('cast.healthIncrease', { amount: 1 }),
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.player.maxHealth).toBe(11);
    expect(result.player.health).toBe(9);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.healthIncrease',
      output: { healthIncrease: 1, playerMaxHealth: 11, playerHealth: 9 },
    });
  });

  it('returns adjacent draw count without mutating card zones', () => {
    const player = createTestPlayer([
      [0, 0, 'Frost'],
      [0, 1, 'Fire'],
      [1, 0, 'Life'],
    ]);
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('wind-draw', 'Wind', [
      createEffectRef('cast.drawAdjacent'),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.drawCount).toBe(3);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.drawAdjacent',
      output: { drawCount: 3, adjacentCount: 3 },
    });
  });

  it('keeps misplaced passive and unknown refs as no-op logs', () => {
    const player = createTestPlayer();
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('unknown-cast', 'Lightning', [
      { effectId: 'passive.tomeCastDamage', params: { damageBonus: 1 } },
      { effectId: 'unknown.effect', params: { amount: 99 } },
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.player).toBe(player);
    expect(result.enemy).toBe(enemy);
    expect(result.arcaneDustDelta).toBe(0);
    expect(result.logs).toMatchObject([
      { effectId: 'passive.tomeCastDamage', displayHint: 'damage', output: { noOp: true } },
      { effectId: 'unknown.effect', displayHint: 'unknown', output: { noOp: true } },
    ]);
  });

  it('applies selected combat artefact passives once per completed cast', () => {
    const player = { ...createTestPlayer(), health: 4, armor: 1 };
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('artefact-cast', 'Fire', [
      createEffectRef('cast.damage', { amount: 3 }),
      createEffectRef('cast.damage', { amount: 2 }),
      createEffectRef('cast.healing', { amount: 4 }),
      createEffectRef('cast.armor', { amount: 3 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
      activeArtefacts: ['tome', 'rod', 'potion'],
    });

    expect(result.enemy?.health).toBe(14);
    expect(result.player.health).toBe(10);
    expect(result.player.armor).toBe(7);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'cast.damage',
      'cast.damage',
      'cast.healing',
      'cast.armor',
      'passive.tomeCastDamage',
      'passive.rodHealing',
      'passive.potionArmor',
    ]);
    expect(result.logs.slice(4)).toMatchObject([
      {
        sourceType: 'artefact',
        sourceId: 'tome',
        output: { target: 'damage', stacking: 'flat', previousValue: 5, nextValue: 6 },
      },
      {
        sourceType: 'artefact',
        sourceId: 'rod',
        output: { target: 'healing', stacking: 'multiplier', previousValue: 4, nextValue: 8 },
      },
      {
        sourceType: 'artefact',
        sourceId: 'potion',
        output: { target: 'armor', stacking: 'multiplier', previousValue: 3, nextValue: 6 },
      },
    ]);
  });

  it('adds Tome damage to non-damage casts exactly once', () => {
    const player = createTestPlayer();
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('support-tome-cast', 'Life', [
      createEffectRef('cast.healing', { amount: 3 }),
      createEffectRef('cast.armor', { amount: 2 }),
      createEffectRef('cast.fortune', { amount: 4 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
      activeArtefacts: ['tome'],
    });

    expect(result.enemy?.health).toBe(19);
    expect(result.player.health).toBe(10);
    expect(result.player.armor).toBe(2);
    expect(result.arcaneDustDelta).toBe(4);
    expect(result.logs.filter((log) => log.effectId === 'passive.tomeCastDamage')).toHaveLength(1);
  });
});

describe('effectResolver end turn effects', () => {
  it('resolves pulse synergy before enemy attack flow consumes the result', () => {
    const player = createTestPlayer([
      [0, 4, 'Void'],
      [1, 4, 'Void'],
    ]);
    const wall = player.wall.map((row) => row.map((cell) => ({ ...cell })));
    wall[0][0] = createWallCell('Void', [
      createEffectRef('passive.pulseSynergy', { amount: 5, synergyType: 'Void' }),
    ]);
    const playerWithPulse = { ...player, wall };

    const result = resolveEndTurnEffects({
      player: playerWithPulse,
      enemy: createTestEnemy(20),
      wall: playerWithPulse.wall,
    });

    expect(result.enemy?.health).toBe(5);
    expect(result.logs[0]).toMatchObject({
      effectId: 'passive.pulseSynergy',
      trigger: 'endTurn',
      output: { modifier: 15, synergyType: 'Void', synergyCount: 3 },
    });
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
