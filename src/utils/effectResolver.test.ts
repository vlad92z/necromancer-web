/**
 * Unit tests for pure cast effect resolution.
 */

import { describe, expect, it } from 'vitest';
import type { EffectRef, Enemy, Player, Rune, RuneType, ScoringWall, SpellWallCharge, WallCell } from '../types/game';
import { createEffectRef, EFFECT_CATALOG } from './effectCatalog';
import { collectActivePassiveEffects, resolveCastEffects, resolveEndTurnEffects, resolvePassiveEffects, resolveStartTurnEffects } from './effectResolver';
import { createEmptyWall, createPlayer } from './gameInitialization';
import { getWallSlotFamily } from './scoring';

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

    expect(result.enemy?.health).toBe(9);
    expect(result.logs).toMatchObject([
      { effectId: 'cast.synergy', output: { damage: 6, synergyCount: 3 } },
      { effectId: 'cast.fragile', output: { damage: 5, isBlocked: false } },
    ]);
  });

  it('does not add triggering runes to mismatched synergy counts', () => {
    const player = createTestPlayer([
      [0, 4, 'Void'],
      [1, 4, 'Void'],
    ]);
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('fire-cast', 'Fire', [
      createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' }),
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.enemy?.health).toBe(16);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.synergy',
      output: { damage: 4, synergyCount: 2 },
    });
  });

  it('resolves adjacent damage with diagonal and orthogonal completed wall runes plus the source', () => {
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

    expect(result.enemy?.health).toBe(10);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.damageAdjacent',
      output: { damage: 10, adjacentCount: 5 },
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

    expect(result.enemy?.health).toBe(14);
    expect(result.logs[0]).toMatchObject({
      output: { damage: 6, adjacentCount: 2 },
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
    wall[0][1] = createWallCell('Lightning', [
      createEffectRef('passive.damageBoost', { amount: 1 }),
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

    expect(result.enemy?.health).toBe(14);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'cast.damage',
      'passive.tomeCastDamage',
      'passive.damageBoost',
      'passive.damageBoostSynergy',
    ]);
    expect(result.logs[2]).toMatchObject({
      output: { previousValue: 4, nextValue: 5 },
    });
    expect(result.logs[3]).toMatchObject({
      output: { synergyType: 'Frost', synergyCount: 2, previousValue: 0, nextValue: 10 },
    });
  });

  it('does not create cast damage from flat damage boost alone', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Lightning', [
      createEffectRef('passive.damageBoost', { amount: 1 }),
    ]);
    const player = { ...createTestPlayer(), wall };
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('support-cast', 'Life', [
      createEffectRef('cast.healing', { amount: 2 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall,
    });

    expect(result.enemy).toBe(enemy);
    expect(result.logs.map((log) => log.effectId)).toEqual(['cast.healing']);
  });

  it('applies adjacent damage boost only to neighboring cast damage', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Lightning', [
      createEffectRef('passive.adjacentDamageBoost', { amount: 1 }),
    ]);
    wall[3][3] = createWallCell('Lightning', [
      createEffectRef('passive.adjacentDamageBoost', { amount: 1 }),
    ]);
    const player = { ...createTestPlayer(), wall };

    const adjacentResult = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune: createTestRune('adjacent-fire', 'Fire', [createEffectRef('cast.damage', { amount: 3 })]),
      wall,
      sourcePosition: { row: 0, col: 1 },
    });
    const distantResult = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune: createTestRune('distant-fire', 'Fire', [createEffectRef('cast.damage', { amount: 3 })]),
      wall,
      sourcePosition: { row: 5, col: 5 },
    });

    expect(adjacentResult.enemy?.health).toBe(16);
    expect(adjacentResult.logs.map((log) => log.effectId)).toEqual([
      'cast.damage',
      'passive.adjacentDamageBoost',
    ]);
    expect(distantResult.enemy?.health).toBe(17);
    expect(distantResult.logs.map((log) => log.effectId)).toEqual(['cast.damage']);
  });

  it('does not double-count the triggering rune for matching passive synergy', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Lightning', [
      createEffectRef('passive.damageBoostSynergy', { percent: 10, synergyType: 'Frost' }),
    ]);
    wall[0][1] = createWallCell('Frost');
    wall[1][1] = createWallCell('Frost');
    const player = { ...createTestPlayer(), wall };
    const castRune = createTestRune('frost-cast', 'Frost', [
      createEffectRef('cast.damage', { amount: 10 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(30),
      castRune,
      wall,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(18);
    expect(result.logs[1]).toMatchObject({
      effectId: 'passive.damageBoostSynergy',
      output: { synergyType: 'Frost', synergyCount: 2, previousValue: 0, nextValue: 20 },
    });
  });

  it('resolves adjacent armor from diagonal and orthogonal completed wall runes plus the source', () => {
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

    expect(result.player.armor).toBe(15);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.armorAdjacent',
      output: { armor: 15, adjacentCount: 5 },
    });
  });

  it('resolves health increase into current and maximum health', () => {
    const player = { ...createTestPlayer(), health: 8, maxHealth: 10 };
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('life-increase', 'Life', [
      createEffectRef('cast.healthIncrease', { amount: 2 }),
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.player.maxHealth).toBe(12);
    expect(result.player.health).toBe(10);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.healthIncrease',
      output: { healthIncrease: 2, playerMaxHealth: 12, playerHealth: 10 },
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

    expect(result.drawCount).toBe(4);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.drawAdjacent',
      output: { drawCount: 4, adjacentCount: 4 },
    });
  });

  it('returns plain draw count without mutating card zones', () => {
    const player = createTestPlayer();
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('wind-draw-plain', 'Wind', [
      createEffectRef('cast.draw', { amount: 1 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
    });

    expect(result.drawCount).toBe(1);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.draw',
      output: { drawCount: 1, totalDrawCount: 1 },
    });
  });

  it('returns typed draw requests without mutating card zones', () => {
    const player = createTestPlayer();
    const enemy = createTestEnemy(20);
    const castRune = createTestRune('wind-draw-fire', 'Wind', [
      createEffectRef('cast.drawType', { amount: 2, targetType: 'Fire' }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
    });

    expect(result.drawCount).toBe(0);
    expect(result.drawTypeRequests).toEqual([{ amount: 2, targetType: 'Fire' }]);
    expect(result.player.deck).toEqual(player.deck);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.drawType',
      output: { drawCount: 2, targetType: 'Fire', totalDrawTypeCount: 2 },
    });
  });

  it('resolves fragile damage with a floor of zero', () => {
    const player = createTestPlayer([
      [0, 3, 'Frost'],
      [1, 3, 'Frost'],
      [2, 3, 'Frost'],
      [3, 3, 'Frost'],
      [4, 3, 'Frost'],
      [5, 3, 'Frost'],
    ]);
    const enemy = createTestEnemy(30);
    const castRune = createTestRune('rare-fire', 'Fire', [
      createEffectRef('cast.damageFragile', { amount: 15, reduction: 3, fragileType: 'Frost' }),
    ]);

    const result = resolveCastEffects({ player, enemy, castRune, wall: player.wall });

    expect(result.enemy?.health).toBe(30);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.damageFragile',
      output: { damage: 0, fragileCount: 6, reduction: 18 },
    });
  });

  it('consumes adjacent completed runes and suppresses them for recovery', () => {
    const player = createTestPlayer([
      [0, 0, 'Frost'],
      [0, 1, 'Fire'],
      [1, 0, 'Life'],
      [1, 1, 'Void'],
      [2, 2, 'Wind'],
      [3, 3, 'Void'],
    ]);
    const wallCharges = createTestWallCharges(player.wall);
    const enemy = createTestEnemy(50);
    const castRune = createTestRune('uncommon-void', 'Void', [
      createEffectRef('cast.damageConsuming', { amount: 2 }),
    ]);

    const result = resolveCastEffects({
      player,
      enemy,
      castRune,
      wall: player.wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(42);
    expect(result.wall[0][0].runeType).toBeNull();
    expect(result.wall[0][1].runeType).toBeNull();
    expect(result.wall[1][0].runeType).toBeNull();
    expect(result.wall[1][1].runeType).toBe('Void');
    expect(result.wall[2][2].runeType).toBeNull();
    expect(result.wall[3][3].runeType).toBe('Void');
    expect(result.suppressedRunes.map((rune) => rune.id)).toEqual([
      'completed-0-0',
      'completed-0-1',
      'completed-1-0',
      'completed-2-2',
    ]);
  });

  it('replays adjacent cast effects while skipping retriggers', () => {
    const player = createTestPlayer();
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [], [createEffectRef('cast.damage', { amount: 3 })]);
    wall[0][1] = createWallCell('Lightning', [], [createEffectRef('cast.retriggerAdjacent')]);
    wall[1][0] = createWallCell('Wind', [], [createEffectRef('cast.fortune', { amount: 4 })]);
    const playerWithWall = { ...player, wall };
    const wallCharges = createTestWallCharges(wall);
    const castRune = createTestRune('rare-lightning', 'Lightning', [
      createEffectRef('cast.retriggerAdjacent'),
    ]);

    const result = resolveCastEffects({
      player: playerWithWall,
      enemy: createTestEnemy(20),
      castRune,
      wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(17);
    expect(result.arcaneDustDelta).toBe(4);
    expect(result.logs.map((log) => log.effectId)).toContain('cast.damage');
    expect(result.logs.filter((log) => log.output.skipped === true)).toHaveLength(0);
  });

  it('applies type-specific addDamage only to matching cast rune type', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [createEffectRef('passive.addDamage', { amount: 5, runeType: 'Fire' })]);
    const player = { ...createTestPlayer(), wall };

    const fireResult = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune: createTestRune('fire-cast', 'Fire', [createEffectRef('cast.damage', { amount: 3 })]),
      wall,
    });
    const frostResult = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune: createTestRune('frost-cast', 'Frost', [createEffectRef('cast.damage', { amount: 3 })]),
      wall,
    });

    expect(fireResult.enemy?.health).toBe(12);
    expect(frostResult.enemy?.health).toBe(17);
  });

  it('applies armorBoost to armor gained', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Frost', [createEffectRef('passive.armorBoost', { amount: 5 })]);
    const player = { ...createTestPlayer(), wall };

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune: createTestRune('armor-cast', 'Frost', [createEffectRef('cast.armor', { amount: 3 })]),
      wall,
    });

    expect(result.player.armor).toBe(8);
  });

  it('resolves healing synergy from completed wall counts and the triggering rune', () => {
    const player = { ...createTestPlayer([[0, 2, 'Life'], [1, 2, 'Life']]), health: 4, maxHealth: 20 };
    const castRune = createTestRune('life-epic', 'Life', [
      createEffectRef('cast.healSynergy', { amount: 3, synergyType: 'Life' }),
    ]);

    const result = resolveCastEffects({ player, enemy: createTestEnemy(20), castRune, wall: player.wall });

    expect(result.player.health).toBe(13);
  });

  it('heals vampire from actual enemy hp loss after overkill clamp', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Void', [createEffectRef('passive.vampire', { percent: 50 })]);
    const player = { ...createTestPlayer(), wall, health: 5, maxHealth: 20 };
    const castRune = createTestRune('void-hit', 'Void', [createEffectRef('cast.damage', { amount: 10 })]);

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(4),
      castRune,
      wall,
    });

    expect(result.enemy?.health).toBe(0);
    expect(result.player.health).toBe(7);
  });

  it('fires explosive once when consumed', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Lightning', [createEffectRef('passive.explosive', { amount: 50 })]);
    const player = { ...createTestPlayer(), wall };
    const wallCharges = createTestWallCharges(wall);
    const castRune = createTestRune('consumer', 'Void', [createEffectRef('cast.damageConsuming', { amount: 0 })]);

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(60),
      castRune,
      wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(10);
    expect(result.logs).toContainEqual(expect.objectContaining({
      effectId: 'passive.explosive',
      output: { damage: 50 },
    }));
  });

  it('returns adjacent runes up to hand cap without suppressing them', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [], [], 'completed-0-0');
    wall[0][1] = createWallCell('Frost', [], [], 'completed-0-1');
    wall[1][0] = createWallCell('Life', [], [], 'completed-1-0');
    const player = { ...createTestPlayer(), wall };
    const wallCharges = createTestWallCharges(wall);
    const castRune = createTestRune('wind-return', 'Wind', [createEffectRef('cast.returnAdjacent')]);

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune,
      wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
      handSize: 8,
    });

    expect(result.returnedRunes).toHaveLength(2);
    expect(result.returnedRunes.map((rune) => rune.runeType)).toEqual(['Fire', 'Frost']);
    expect(result.returnedRunes.every((rune) => !['completed-0-0', 'completed-0-1'].includes(rune.id))).toBe(true);
    expect(result.returnedOverflowRunes).toHaveLength(1);
    expect(result.returnedOverflowRunes[0]?.runeType).toBe('Life');
    expect(result.returnedOverflowRunes[0]?.id).not.toBe('completed-1-0');
    expect(result.suppressedRunes).toEqual([]);
    expect(result.wall[0][0].runeType).toBeNull();
    expect(result.wall[0][1].runeType).toBeNull();
    expect(result.wall[1][0].runeType).toBeNull();
  });

  it('destroys a deterministic random type target while excluding the source', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [], [], 'completed-0-0');
    wall[0][1] = createWallCell('Fire', [], [], 'completed-0-1');
    wall[0][2] = createWallCell('Fire', [], [], 'completed-0-2');
    const player = { ...createTestPlayer(), wall };
    const wallCharges = createTestWallCharges(wall);
    const castRune = createTestRune('destroyer', 'Void', [createEffectRef('cast.destroyType', { targetType: 'Fire' })]);

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune,
      wall,
      wallCharges,
      sourcePosition: { row: 0, col: 0 },
      rng: () => 0.75,
    });

    expect(result.wall[0][0].runeType).toBe('Fire');
    expect(result.wall[0][1].runeType).toBe('Fire');
    expect(result.wall[0][2].runeType).toBeNull();
    expect(result.suppressedRunes.map((rune) => rune.id)).toEqual(['completed-0-2']);
  });

  it('no-ops random type destroy when no eligible target exists', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire');
    const player = { ...createTestPlayer(), wall };
    const castRune = createTestRune('destroyer', 'Void', [createEffectRef('cast.destroyType', { targetType: 'Fire' })]);

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune,
      wall,
      wallCharges: createTestWallCharges(wall),
      sourcePosition: { row: 0, col: 0 },
      rng: () => 0,
    });

    expect(result.wall[0][0].runeType).toBe('Fire');
    expect(result.suppressedRunes).toEqual([]);
    expect(result.logs[0]).toMatchObject({ effectId: 'cast.destroyType', output: { noTarget: true } });
  });

  it('converts random and adjacent targets into common no-effect runes while suppressing originals', () => {
    const randomWall = createEmptyWall(6);
    randomWall[0][0] = createWallCell('Fire', [], [], 'completed-0-0');
    randomWall[0][1] = createWallCell('Fire', [createEffectRef('passive.explosive', { amount: 4 })], [createEffectRef('cast.damage', { amount: 9 })], 'completed-0-1');
    const randomPlayer = { ...createTestPlayer(), wall: randomWall };
    const randomResult = resolveCastEffects({
      player: randomPlayer,
      enemy: createTestEnemy(20),
      castRune: createTestRune('converter', 'Void', [
        createEffectRef('cast.convertRandom', { sourceType: 'Fire', targetType: 'Frost' }),
      ]),
      wall: randomWall,
      wallCharges: createTestWallCharges(randomWall),
      sourcePosition: { row: 0, col: 0 },
      rng: () => 0,
    });

    expect(randomResult.wall[0][1]).toEqual({
      id: 'completed-0-1',
      runeType: 'Frost',
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    });
    expect(randomResult.suppressedRunes.map((rune) => rune.id)).toEqual(['completed-0-1']);
    expect(randomResult.enemy?.health).toBe(16);

    const adjacentWall = createEmptyWall(6);
    adjacentWall[0][0] = createWallCell('Fire', [], [], 'completed-0-0');
    adjacentWall[0][1] = createWallCell('Life', [], [], 'completed-0-1');
    adjacentWall[2][2] = createWallCell('Wind', [], [], 'completed-2-2');
    const adjacentResult = resolveCastEffects({
      player: { ...createTestPlayer(), wall: adjacentWall },
      enemy: createTestEnemy(20),
      castRune: createTestRune('adjacent-converter', 'Void', [createEffectRef('cast.convertAdjacent', { targetType: 'Void' })]),
      wall: adjacentWall,
      wallCharges: createTestWallCharges(adjacentWall),
      sourcePosition: { row: 1, col: 1 },
    });

    expect(adjacentResult.wall[0][0].runeType).toBe('Void');
    expect(adjacentResult.wall[0][1].runeType).toBe('Void');
    expect(adjacentResult.wall[2][2].runeType).toBe('Void');
    expect(adjacentResult.suppressedRunes.map((rune) => rune.id)).toEqual([
      'completed-0-0',
      'completed-0-1',
      'completed-2-2',
    ]);
  });

  it('reduces maximum health and clamps current health', () => {
    const player = { ...createTestPlayer(), health: 9, maxHealth: 10 };
    const castRune = createTestRune('health-loss', 'Void', [createEffectRef('cast.healthDecrease', { amount: 4 })]);

    const result = resolveCastEffects({ player, enemy: createTestEnemy(20), castRune, wall: player.wall });

    expect(result.player.maxHealth).toBe(6);
    expect(result.player.health).toBe(6);
  });

  it('gains adjacent arcane dust from completed neighbors plus the source', () => {
    const player = createTestPlayer([
      [0, 0, 'Frost'],
      [0, 1, 'Fire'],
      [2, 2, 'Wind'],
      [4, 4, 'Void'],
    ]);
    const castRune = createTestRune('dust-adjacent', 'Wind', [createEffectRef('cast.arcaneDustAdjacent', { amount: 5 })]);

    const result = resolveCastEffects({
      player,
      enemy: createTestEnemy(20),
      castRune,
      wall: player.wall,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.arcaneDustDelta).toBe(20);
  });

  it('charges adjacent incomplete slots without creating spent runes or completing them', () => {
    const wall = createEmptyWall(6);
    wall[1][1] = createWallCell('Wind');
    wall[2][2] = createWallCell('Fire');
    const wallCharges = createTestWallCharges(wall);
    wallCharges[1][2] = {
      ...wallCharges[1][2],
      currentCount: 0,
      requiredCount: 2,
      stagedRune: createTestRune('staged-life', 'Life', []),
      lockedRuneType: 'Life',
    };
    wallCharges[2][1] = {
      ...wallCharges[2][1],
      currentCount: 1,
      requiredCount: 3,
      stagedRune: createTestRune('staged-void', 'Void', []),
      lockedRuneType: 'Void',
    };
    const castRune = createTestRune('charger', 'Wind', [createEffectRef('cast.chargeAdjacent')]);

    const result = resolveCastEffects({
      player: { ...createTestPlayer(), wall },
      enemy: createTestEnemy(20),
      castRune,
      wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.wallCharges[1][2]).toMatchObject({ currentCount: 1, spentRunes: [], completedRuneId: null });
    expect(result.wallCharges[2][1]).toMatchObject({ currentCount: 2, spentRunes: [], completedRuneId: null });
    expect(result.wallCharges[2][2].currentCount).toBe(1);
  });

  it('completes a one-away staged rune via virtual charge and resolves its cast effects', () => {
    const wall = createEmptyWall(6);
    wall[1][1] = createWallCell('Wind');
    const wallCharges = createTestWallCharges(wall);
    wallCharges[1][2] = {
      ...wallCharges[1][2],
      currentCount: 1,
      requiredCount: 2,
      stagedRune: {
        id: 'staged-fire',
        runeType: 'Fire',
        rarity: 'uncommon',
        castEffectRefs: [createEffectRef('cast.damage', { amount: 4 })],
        passiveEffectRefs: [],
      },
      spentRunes: [createTestRune('spent-fire', 'Fire', [])],
      lockedRuneType: 'Fire',
    };

    const result = resolveCastEffects({
      player: { ...createTestPlayer(), wall },
      enemy: createTestEnemy(10),
      castRune: createTestRune('charger', 'Wind', [createEffectRef('cast.chargeAdjacent')]),
      wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(6);
    expect(result.wall[1][2]).toMatchObject({ runeType: 'Fire', rarity: 'uncommon' });
    expect(result.wallCharges[1][2]).toMatchObject({
      currentCount: 2,
      stagedRune: null,
      spentRunes: [],
      completedRuneId: expect.any(String),
    });
    expect(result.discardedRunes.map((rune) => rune.id)).toEqual(['staged-fire', 'spent-fire']);
    expect(result.logs.filter((log) => log.effectId === 'cast.damage')).toMatchObject([
      { output: { damage: 4, enemyHealth: 6 } },
    ]);
  });

  it('resolves multiple virtual completions in deterministic adjacent order', () => {
    const wall = createEmptyWall(6);
    wall[1][1] = createWallCell('Wind');
    const wallCharges = createTestWallCharges(wall);
    wallCharges[0][0] = {
      ...wallCharges[0][0],
      currentCount: 1,
      requiredCount: 2,
      stagedRune: {
        id: 'staged-fire',
        runeType: 'Fire',
        rarity: 'uncommon',
        castEffectRefs: [createEffectRef('cast.damage', { amount: 2 })],
        passiveEffectRefs: [],
      },
      lockedRuneType: 'Fire',
    };
    wallCharges[0][1] = {
      ...wallCharges[0][1],
      currentCount: 1,
      requiredCount: 2,
      stagedRune: {
        id: 'staged-frost',
        runeType: 'Frost',
        rarity: 'uncommon',
        castEffectRefs: [createEffectRef('cast.damage', { amount: 3 })],
        passiveEffectRefs: [],
      },
      lockedRuneType: 'Frost',
    };

    const result = resolveCastEffects({
      player: { ...createTestPlayer(), wall },
      enemy: createTestEnemy(10),
      castRune: createTestRune('charger', 'Wind', [createEffectRef('cast.chargeAdjacent')]),
      wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(5);
    expect(result.logs.filter((log) => log.effectId === 'cast.damage').map((log) => log.output.damage)).toEqual([2, 3]);
  });

  it('replays type-targeted cast effects while skipping retriggers', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [], [createEffectRef('cast.damage', { amount: 3 })]);
    wall[0][1] = createWallCell('Fire', [], [createEffectRef('cast.retriggerType', { targetType: 'Fire' })]);
    wall[1][0] = createWallCell('Frost', [], [createEffectRef('cast.damage', { amount: 5 })]);
    const castRune = createTestRune('type-retrigger', 'Lightning', [createEffectRef('cast.retriggerType', { targetType: 'Fire' })]);

    const result = resolveCastEffects({
      player: { ...createTestPlayer(), wall },
      enemy: createTestEnemy(20),
      castRune,
      wall,
      wallCharges: createTestWallCharges(wall),
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(17);
    expect(result.logs.filter((log) => log.effectId === 'cast.retriggerType' && log.output.skipped === true)).toHaveLength(0);
    expect(result.logs.at(-1)).toMatchObject({
      effectId: 'cast.retriggerType',
      output: { targetType: 'Fire', targetCount: 2, retriggeredEffectIds: ['cast.damage'] },
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

  it('applies flat damage boost to pulse damage without creating damage on empty end turns', () => {
    const player = createTestPlayer([
      [0, 4, 'Void'],
      [1, 4, 'Void'],
    ]);
    const wall = player.wall.map((row) => row.map((cell) => ({ ...cell })));
    wall[0][0] = createWallCell('Void', [
      createEffectRef('passive.pulseSynergy', { amount: 5, synergyType: 'Void' }),
    ]);
    wall[0][1] = createWallCell('Lightning', [
      createEffectRef('passive.damageBoost', { amount: 1 }),
    ]);
    const playerWithBoostedPulse = { ...player, wall };

    const result = resolveEndTurnEffects({
      player: playerWithBoostedPulse,
      enemy: createTestEnemy(20),
      wall: playerWithBoostedPulse.wall,
    });

    expect(result.enemy?.health).toBe(4);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'passive.pulseSynergy',
      'passive.damageBoost',
    ]);
    expect(result.logs[1]).toMatchObject({
      trigger: 'endTurn',
      output: { modifier: 1, previousValue: 15, nextValue: 16 },
    });

    const emptyEndTurn = resolveEndTurnEffects({
      player: playerWithBoostedPulse,
      enemy: createTestEnemy(20),
      wall: createEmptyWall(6),
    });
    expect(emptyEndTurn.enemy?.health).toBe(20);
    expect(emptyEndTurn.logs).toEqual([]);
  });

  it('applies adjacent damage boost to neighboring end-turn pulse damage only', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Void', [
      createEffectRef('passive.pulseSynergy', { amount: 1, synergyType: 'Void' }),
    ]);
    wall[0][1] = createWallCell('Lightning', [
      createEffectRef('passive.adjacentDamageBoost', { amount: 1 }),
    ]);
    wall[5][5] = createWallCell('Lightning', [
      createEffectRef('passive.adjacentDamageBoost', { amount: 1 }),
    ]);
    const player = { ...createTestPlayer(), wall };

    const result = resolveEndTurnEffects({
      player,
      enemy: createTestEnemy(20),
      wall,
    });

    expect(result.enemy?.health).toBe(18);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'passive.pulseSynergy',
      'passive.adjacentDamageBoost',
    ]);
    expect(result.logs[0]).toMatchObject({
      output: { modifier: 1, synergyType: 'Void', synergyCount: 1 },
    });
    expect(result.logs[1]).toMatchObject({
      output: { modifier: 1, previousValue: 1, nextValue: 2 },
    });
  });

  it('grants end-turn armor for completed Frost runes', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Frost', [
      createEffectRef('passive.armorEndTurnSynergy', { amount: 2, synergyType: 'Frost' }),
    ]);
    wall[0][1] = createWallCell('Frost');
    wall[0][2] = createWallCell('Fire');
    const player = { ...createTestPlayer(), wall, armor: 1 };

    const result = resolveEndTurnEffects({
      player,
      enemy: createTestEnemy(20),
      wall,
    });

    expect(result.player.armor).toBe(5);
    expect(result.enemy?.health).toBe(20);
    expect(result.logs).toHaveLength(1);
    expect(result.logs[0]).toMatchObject({
      effectId: 'passive.armorEndTurnSynergy',
      trigger: 'endTurn',
      output: { modifier: 4, synergyType: 'Frost', synergyCount: 2 },
    });
  });
});

describe('effectResolver start turn effects', () => {
  it('heals and requests draw from completed wall passives', () => {
    const player = { ...createTestPlayer(), health: 6, maxHealth: 10 };
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Life', [createEffectRef('passive.healingStartTurn', { amount: 2 })]);
    wall[0][1] = createWallCell('Wind', [createEffectRef('passive.drawingStartTurn', { amount: 1 })]);
    const result = resolveStartTurnEffects({
      player: { ...player, wall },
      wall,
    });

    expect(result.player.health).toBe(8);
    expect(result.drawCount).toBe(1);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'passive.healingStartTurn',
      'passive.drawingStartTurn',
    ]);
  });

  it('heals from completed Life runes at start of turn', () => {
    const player = { ...createTestPlayer(), health: 6, maxHealth: 20 };
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Life', [
      createEffectRef('passive.healingStartTurnSynergy', { amount: 1, synergyType: 'Life' }),
    ]);
    wall[0][1] = createWallCell('Life');
    wall[1][1] = createWallCell('Life');
    wall[2][2] = createWallCell('Void');

    const result = resolveStartTurnEffects({
      player: { ...player, wall },
      wall,
    });

    expect(result.player.health).toBe(9);
    expect(result.logs[0]).toMatchObject({
      effectId: 'passive.healingStartTurnSynergy',
      output: { modifier: 3, synergyType: 'Life', synergyCount: 3 },
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
      { sourceType: 'rune', sourceId: 'completed-Frost', effectId: 'passive.potionArmor', sourceOrder: 5 },
      { sourceType: 'rune', sourceId: 'completed-Fire', effectId: 'passive.tomeCastDamage', sourceOrder: 8 },
      { sourceType: 'artefact', sourceId: 'rod', effectId: 'passive.rodHealing', sourceOrder: 0 },
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
      epicChance: 3,
    });
    expect(onDeckDraftOffer.logs).toEqual([]);

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
        'completed-Fire:passive.tomeCastDamage:flat',
        'completed-Life:passive.rodHealing:multiplier',
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
        sourceId: 'completed-Fire',
        effectId: 'unknown.passive',
        trigger: 'onCast',
        displayHint: 'unknown',
        output: { noOp: true },
      },
      {
        sourceType: 'rune',
        sourceId: 'completed-Fire',
        effectId: 'cast.damage',
        trigger: 'onCast',
        displayHint: 'damage',
        output: { noOp: true },
      },
    ]);
  });

  it('ignores staged incomplete slots for completed-wall effects and targeting', () => {
    const wall = createEmptyWall(6);
    const wallCharges = createTestWallCharges(wall);
    const stagedVoid = createTestRune('staged-void', 'Void', [
      createEffectRef('cast.damage', { amount: 9 }),
    ]);
    stagedVoid.passiveEffectRefs = [createEffectRef('passive.tomeCastDamage', { damageBonus: 99 })];
    wallCharges[0][0] = {
      ...wallCharges[0][0],
      lockedRuneType: 'Void',
      requiredCount: 2,
      currentCount: 1,
      stagedRune: stagedVoid,
      spentRunes: [createTestRune('void-fuel', 'Void', [])],
    };
    wallCharges[0][1] = {
      ...wallCharges[0][1],
      lockedRuneType: 'Fire',
      requiredCount: 1,
      currentCount: 0,
      stagedRune: createTestRune('staged-fire', 'Fire', []),
    };
    const castRune = createTestRune('stage-check', 'Wind', [
      createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' }),
      createEffectRef('cast.fragile', { amount: 5, fragileType: 'Fire' }),
      createEffectRef('cast.damageAdjacent', { amount: 3 }),
      createEffectRef('cast.destroyType', { targetType: 'Fire' }),
      createEffectRef('cast.returnAdjacent'),
    ]);

    const result = resolveCastEffects({
      player: { ...createTestPlayer(), wall },
      enemy: createTestEnemy(30),
      castRune,
      wall,
      wallCharges,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(collectActivePassiveEffects({ wall, activeArtefacts: [] })).toEqual([]);
    expect(result.enemy?.health).toBe(22);
    expect(result.logs).toMatchObject([
      { effectId: 'cast.synergy', output: { synergyCount: 0, damage: 0 } },
      { effectId: 'cast.fragile', output: { damage: 5, isBlocked: false } },
      { effectId: 'cast.damageAdjacent', output: { adjacentCount: 1, damage: 3 } },
      { effectId: 'cast.destroyType', output: { noTarget: true } },
      { effectId: 'cast.returnAdjacent', output: { adjacentCount: 0, returnedRuneIds: [] } },
    ]);
    expect(result.returnedRunes).toEqual([]);
    expect(result.suppressedRunes).toEqual([]);
    expect(result.wallCharges[0][0].stagedRune?.id).toBe('staged-void');
    expect(result.wallCharges[0][1].stagedRune?.id).toBe('staged-fire');
  });

  it('uses wall-copy ids for retriggered cast logs', () => {
    const wall = createEmptyWall(6);
    wall[0][0] = createWallCell('Fire', [], [createEffectRef('cast.damage', { amount: 3 })], 'wall-copy-fire');
    const castRune = createTestRune('retrigger-source', 'Lightning', [createEffectRef('cast.retriggerAdjacent')]);

    const result = resolveCastEffects({
      player: { ...createTestPlayer(), wall },
      enemy: createTestEnemy(20),
      castRune,
      wall,
      wallCharges: createTestWallCharges(wall),
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(17);
    expect(result.logs).toContainEqual(expect.objectContaining({
      sourceId: 'wall-copy-fire',
      effectId: 'cast.damage',
    }));
    expect(result.logs).not.toContainEqual(expect.objectContaining({ sourceId: 'wall:0:0' }));
  });
});

function createTestPlayer(cells: Array<[number, number, RuneType]> = []): Player {
  const player = createPlayer('player-1', 'Tester', 10, [], 10);
  const wall: ScoringWall = createEmptyWall(6);
  cells.forEach(([row, col, runeType]) => {
    wall[row][col] = createWallCell(runeType, [], [], `completed-${row}-${col}`);
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

function createWallCell(
  runeType: RuneType,
  passiveEffectRefs: EffectRef[] = [],
  castEffectRefs: EffectRef[] = [],
  id: string = `completed-${runeType}`
): WallCell {
  return {
    id,
    runeType,
    rarity: 'common',
    castEffectRefs,
    passiveEffectRefs,
  };
}

function createTestWallCharges(wall: ScoringWall): SpellWallCharge[][] {
  return wall.map((row, rowIndex) => row.map((cell, colIndex) => ({
    row: rowIndex,
    col: colIndex,
    slotFamily: getWallSlotFamily(rowIndex, colIndex),
    lockedRuneType: cell.runeType,
    requiredCount: cell.runeType ? 1 : 0,
    currentCount: cell.runeType ? 1 : 0,
    stagedRune: null,
    spentRunes: [],
    completedRuneId: cell.id,
  })));
}
