import { describe, expect, it } from 'vitest';
import type { Enemy, Rune, RuneType, WallCell } from '../types/game';
import { createEffectRef } from './effectCatalog';
import { createEmptyWallCharges, createPlayer } from './gameInitialization';
import {
  castRuneToWallSlot,
  collectVictoryDeck,
  countFilledWallRunesByType,
  drawRunes,
  drawRunesOfType,
  endPlayerTurn,
  resolveCompletedRuneCastEffects,
  resolveEnemyTurn,
  wallHasRuneType,
} from './combatResolution';

describe('combatResolution wall casting', () => {
  it('charges an incomplete matching wall slot without filling the wall', () => {
    const fireRune = createTestRune('fire-charge', 'Fire');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);

    const result = castRuneToWallSlot({
      player,
      hand: [fireRune],
      discardPile: [],
      wallCharges: createEmptyWallCharges(6),
      selectedHandRuneId: fireRune.id,
      row: 1,
      col: 2,
    });

    expect(result.status).toBe('charged');
    expect(result.hand).toEqual([]);
    expect(result.discardPile).toEqual([]);
    expect(result.selectedHandRuneId).toBeNull();
    expect(result.player.wall[1][2].runeType).toBeNull();
    expect(result.wallCharges[1][2]).toMatchObject({
      lockedRuneType: 'Fire',
      currentCount: 1,
      requiredCount: 2,
      completedRuneId: null,
    });
    expect(result.wallCharges[1][2].spentRunes.map((rune) => rune.id)).toEqual(['fire-charge']);
  });

  it('fills the wall slot on the final matching charge', () => {
    const firstRune = createTestRune('fire-spent', 'Fire');
    const finalRune = createTestRune('fire-final', 'Fire');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wallCharges = createEmptyWallCharges(6);
    wallCharges[1][2] = {
      ...wallCharges[1][2],
      lockedRuneType: 'Fire',
      currentCount: 1,
      spentRunes: [firstRune],
    };

    const result = castRuneToWallSlot({
      player,
      hand: [finalRune],
      discardPile: [],
      wallCharges,
      selectedHandRuneId: finalRune.id,
      row: 1,
      col: 2,
    });

    expect(result.status).toBe('completed');
    expect(result.hand).toEqual([]);
    expect(result.discardPile).toEqual([firstRune]);
    expect(result.player.wall[1][2]).toEqual({
      runeType: 'Fire',
      rarity: finalRune.rarity,
      castEffectRefs: finalRune.castEffectRefs,
      passiveEffectRefs: finalRune.passiveEffectRefs,
    });
    expect(result.wallCharges[1][2]).toMatchObject({
      lockedRuneType: 'Fire',
      currentCount: 2,
      completedRuneId: 'fire-final',
    });
    expect(result.wallCharges[1][2].spentRunes).toEqual([]);
    expect(result.completedPosition).toEqual({ row: 1, col: 2 });
  });

  it('keeps the final matching rune out of discard when completing a slot', () => {
    const firstRune = createTestRune('fire-spent', 'Fire');
    const finalRune = createTestRune('fire-final', 'Fire');
    const existingDiscardRune = createTestRune('existing-discard', 'Void');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wallCharges = createEmptyWallCharges(6);
    wallCharges[1][2] = {
      ...wallCharges[1][2],
      lockedRuneType: 'Fire',
      currentCount: 1,
      spentRunes: [firstRune],
    };

    const result = castRuneToWallSlot({
      player,
      hand: [finalRune],
      discardPile: [existingDiscardRune],
      wallCharges,
      selectedHandRuneId: finalRune.id,
      row: 1,
      col: 2,
    });

    expect(result.status).toBe('completed');
    expect(result.discardPile.map((rune) => rune.id)).toEqual(['existing-discard', 'fire-spent']);
    expect(result.discardPile).not.toContain(finalRune);
    expect(result.wallCharges[1][2].completedRuneId).toBe(finalRune.id);
  });

  it('accepts either rune type in an unlocked dual-type slot', () => {
    const voidRune = createTestRune('void-start', 'Void');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);

    const result = castRuneToWallSlot({
      player,
      hand: [voidRune],
      discardPile: [],
      wallCharges: createEmptyWallCharges(6),
      selectedHandRuneId: voidRune.id,
      row: 1,
      col: 2,
    });

    expect(result.status).toBe('charged');
    expect(result.wallCharges[1][2]).toMatchObject({
      slotFamily: 'fireVoid',
      lockedRuneType: 'Void',
      currentCount: 1,
    });
  });

  it('rejects the other family rune after a real charge locks the slot', () => {
    const fireRune = createTestRune('fire-spent', 'Fire');
    const voidRune = createTestRune('void-rejected', 'Void');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wallCharges = createEmptyWallCharges(6);
    wallCharges[1][2] = {
      ...wallCharges[1][2],
      lockedRuneType: 'Fire',
      currentCount: 1,
      spentRunes: [fireRune],
    };

    const result = castRuneToWallSlot({
      player,
      hand: [voidRune],
      discardPile: [],
      wallCharges,
      selectedHandRuneId: voidRune.id,
      row: 1,
      col: 2,
    });

    expect(result.status).toBe('invalid');
    expect(result.wallCharges).toBe(wallCharges);
    expect(result.selectedHandRuneId).toBe(voidRune.id);
  });

  it('rejects wrong-type casts without clearing selection', () => {
    const lifeRune = createTestRune('life-wrong-type', 'Life');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wallCharges = createEmptyWallCharges(6);

    const result = castRuneToWallSlot({
      player,
      hand: [lifeRune],
      discardPile: [],
      wallCharges,
      selectedHandRuneId: lifeRune.id,
      row: 0,
      col: 0,
    });

    expect(result.status).toBe('invalid');
    expect(result.hand).toEqual([lifeRune]);
    expect(result.discardPile).toEqual([]);
    expect(result.wallCharges).toBe(wallCharges);
    expect(result.selectedHandRuneId).toBe(lifeRune.id);
  });
});

describe('combatResolution turn cycling', () => {
  it('draws extra runes from deck then discard while respecting hand cap', () => {
    const hand = createRunes('hand', 8);
    const deckRunes = createRunes('deck-extra', 1);
    const discardRunes = createRunes('discard-extra', 4);
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = drawRunes({
      player,
      hand,
      discardPile: discardRunes,
      drawCount: 5,
      handLimit: 10,
      shuffleRunes: (runes) => runes,
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      ...hand.map((rune) => rune.id),
      'deck-extra-0',
      'discard-extra-0',
    ]);
    expect(result.player.deck.map((rune) => rune.id)).toEqual([
      'discard-extra-1',
      'discard-extra-2',
      'discard-extra-3',
    ]);
    expect(result.discardPile).toEqual([]);
  });

  it('draws typed runes from deck only while preserving deck order', () => {
    const hand = createRunes('hand', 1);
    const deckRunes = [
      createTestRune('deck-fire-0', 'Fire'),
      createTestRune('deck-life-0', 'Life'),
      createTestRune('deck-fire-1', 'Fire'),
      createTestRune('deck-void-0', 'Void'),
      createTestRune('deck-fire-2', 'Fire'),
    ];
    const discardRunes = [createTestRune('discard-fire-0', 'Fire')];
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = drawRunesOfType({
      player,
      hand,
      discardPile: discardRunes,
      drawTypeRequests: [{ amount: 2, targetType: 'Fire' }],
      handLimit: 10,
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      'hand-0',
      'deck-fire-0',
      'deck-fire-1',
    ]);
    expect(result.player.deck.map((rune) => rune.id)).toEqual([
      'deck-life-0',
      'deck-void-0',
      'deck-fire-2',
    ]);
    expect(result.discardPile.map((rune) => rune.id)).toEqual(['discard-fire-0']);
  });

  it('draws as many typed runes as are available from deck', () => {
    const deckRunes = [
      createTestRune('deck-fire-0', 'Fire'),
      createTestRune('deck-life-0', 'Life'),
    ];
    const discardRunes = [createTestRune('discard-fire-0', 'Fire')];
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = drawRunesOfType({
      player,
      hand: [],
      discardPile: discardRunes,
      drawTypeRequests: [{ amount: 3, targetType: 'Fire' }],
      handLimit: 10,
    });

    expect(result.hand.map((rune) => rune.id)).toEqual(['deck-fire-0']);
    expect(result.player.deck.map((rune) => rune.id)).toEqual(['deck-life-0']);
    expect(result.discardPile.map((rune) => rune.id)).toEqual(['discard-fire-0']);
  });

  it('moves remaining hand to discard before drawing from deck', () => {
    const handRune = createTestRune('hand-1', 'Fire');
    const deckRunes = createRunes('deck', 6);
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = endPlayerTurn({
      player,
      hand: [handRune],
      discardPile: [],
      shuffleRunes: (runes) => runes,
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      'deck-0',
      'deck-1',
      'deck-2',
      'deck-3',
      'deck-4',
      'deck-5',
    ]);
    expect(result.discardPile.map((rune) => rune.id)).toEqual(['hand-1']);
    expect(result.player.deck).toEqual([]);
  });

  it('draws from deck before reshuffling discard when deck is short', () => {
    const deckRunes = createRunes('deck-short', 2);
    const discardRunes = createRunes('discard', 5);
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = endPlayerTurn({
      player,
      hand: [],
      discardPile: discardRunes,
      shuffleRunes: (runes) => runes,
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      'deck-short-0',
      'deck-short-1',
      'discard-0',
      'discard-1',
      'discard-2',
      'discard-3',
    ]);
    expect(result.player.deck.map((rune) => rune.id)).toEqual(['discard-4']);
    expect(result.discardPile).toEqual([]);
  });

  it('does not reshuffle discard when deck can fill the hand', () => {
    const deckRunes = createRunes('deck-full', 8);
    const discardRunes = createRunes('discard-kept', 2);
    const player = createPlayer('player-1', 'Tester', 10, deckRunes, 10);

    const result = endPlayerTurn({
      player,
      hand: [],
      discardPile: discardRunes,
      shuffleRunes: (runes) => [...runes].reverse(),
    });

    expect(result.hand.map((rune) => rune.id)).toEqual([
      'deck-full-0',
      'deck-full-1',
      'deck-full-2',
      'deck-full-3',
      'deck-full-4',
      'deck-full-5',
    ]);
    expect(result.player.deck.map((rune) => rune.id)).toEqual(['deck-full-6', 'deck-full-7']);
    expect(result.discardPile).toEqual(discardRunes);
  });

  it('supports partial and empty hands when no cards are available', () => {
    const partialDeck = createRunes('partial', 2);
    const partialPlayer = createPlayer('player-1', 'Tester', 10, partialDeck, 10);
    const emptyPlayer = createPlayer('player-1', 'Tester', 10, [], 10);

    const partialResult = endPlayerTurn({
      player: partialPlayer,
      hand: [],
      discardPile: [],
    });
    const emptyResult = endPlayerTurn({
      player: emptyPlayer,
      hand: [],
      discardPile: [],
    });

    expect(partialResult.hand.map((rune) => rune.id)).toEqual(['partial-0', 'partial-1']);
    expect(partialResult.player.deck).toEqual([]);
    expect(emptyResult.hand).toEqual([]);
    expect(emptyResult.player.deck).toEqual([]);
  });
});

describe('combatResolution basic combat effects', () => {
  it('applies damage to enemy health and returns a cast log', () => {
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const enemy = createTestEnemy(10);
    const rune = createTestRuneWithEffects('damage-rune', 'Fire', [
      { type: 'Damage', amount: 3, rarity: 'common' },
    ]);

    const result = resolveCompletedRuneCastEffects({ player, enemy, rune });

    expect(result.enemy?.health).toBe(7);
    expect(result.player).toBe(player);
    expect(result.arcaneDustDelta).toBe(0);
    expect(result.logs).toMatchObject([
      {
        sourceType: 'rune',
        sourceId: 'damage-rune',
        effectId: 'cast.damage',
        trigger: 'onCast',
        displayHint: 'damage',
        output: { damage: 3, enemyHealth: 7 },
      },
    ]);
  });

  it('clamps healing at max health and adds armor', () => {
    const player = {
      ...createPlayer('player-1', 'Tester', 10, [], 10),
      health: 8,
      armor: 1,
    };
    const rune = createTestRuneWithEffects('support-rune', 'Life', [
      { type: 'Healing', amount: 5, rarity: 'common' },
      { type: 'Armor', amount: 2, rarity: 'common' },
    ]);

    const result = resolveCompletedRuneCastEffects({ player, enemy: createTestEnemy(10), rune });

    expect(result.player.health).toBe(10);
    expect(result.player.armor).toBe(3);
    expect(result.logs.map((log) => log.effectId)).toEqual(['cast.healing', 'cast.armor']);
  });

  it('returns fortune as arcane dust delta and keeps unknown effects as no-op logs', () => {
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const enemy = createTestEnemy(10);
    const rune = createTestRuneWithEffects('mixed-rune', 'Wind', [
      { type: 'Fortune', amount: 4, rarity: 'common' },
      { type: 'RemovedLegacyEffect', amount: 9, rarity: 'common' },
    ]);

    const result = resolveCompletedRuneCastEffects({ player, enemy, rune });

    expect(result.arcaneDustDelta).toBe(4);
    expect(result.player).toBe(player);
    expect(result.enemy).toBe(enemy);
    expect(result.logs).toMatchObject([
      { effectId: 'cast.fortune', output: { arcaneDust: 4, arcaneDustDelta: 4 } },
      { effectId: 'legacy.unknown', output: { noOp: true } },
    ]);
  });

  it('counts filled wall runes by type across the whole wall', () => {
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wall = player.wall.map((row) => [...row]);
    wall[0][0] = createWallCell('Void');
    wall[0][1] = createWallCell('Fire');
    wall[3][4] = createWallCell('Void');

    const counts = countFilledWallRunesByType(wall);

    expect(counts.get('Void')).toBe(2);
    expect(counts.get('Fire')).toBe(1);
    expect(counts.get('Life')).toBeUndefined();
    expect(wallHasRuneType(wall, 'Void')).toBe(true);
    expect(wallHasRuneType(wall, 'Life')).toBe(false);
  });

  it('passes completed wall position into adjacent damage resolution', () => {
    const player = createPlayerWithWall([
      [0, 0, 'Frost'],
      [0, 1, 'Life'],
      [1, 0, 'Wind'],
    ]);
    const enemy = createTestEnemy(20);
    const rune = {
      ...createTestRune('adjacent-fire', 'Fire'),
      castEffectRefs: [createEffectRef('cast.damageAdjacent', { amount: 2 })],
    };

    const result = resolveCompletedRuneCastEffects({
      player,
      enemy,
      rune,
      sourcePosition: { row: 1, col: 1 },
    });

    expect(result.enemy?.health).toBe(12);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.damageAdjacent',
      output: { adjacentCount: 4, damage: 8 },
    });
  });

  it('applies Synergy damage using whole completed wall counts', () => {
    const player = createPlayerWithWall([
      [0, 4, 'Void'],
      [1, 4, 'Void'],
      [2, 0, 'Fire'],
    ]);
    const enemy = createTestEnemy(20);
    const rune = createTestRuneWithEffects('void-synergy', 'Void', [
      { type: 'Synergy', amount: 2, synergyType: 'Void', rarity: 'uncommon' },
    ]);

    const result = resolveCompletedRuneCastEffects({ player, enemy, rune });

    expect(result.enemy?.health).toBe(14);
    expect(result.player).toBe(player);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.synergy',
      output: { damage: 6, synergyType: 'Void', synergyCount: 3, enemyHealth: 14 },
    });
  });

  it('applies ArmorSynergy using whole completed wall counts', () => {
    const player = {
      ...createPlayerWithWall([
        [0, 3, 'Frost'],
        [1, 3, 'Frost'],
        [2, 4, 'Void'],
      ]),
      armor: 1,
    };
    const rune = createTestRuneWithEffects('frost-armor-synergy', 'Frost', [
      { type: 'ArmorSynergy', amount: 3, synergyType: 'Frost', rarity: 'rare' },
    ]);

    const result = resolveCompletedRuneCastEffects({ player, enemy: createTestEnemy(20), rune });

    expect(result.player.armor).toBe(10);
    expect(result.logs[0]).toMatchObject({
      effectId: 'cast.armorSynergy',
      output: { armor: 9, synergyType: 'Frost', synergyCount: 3, playerArmor: 10 },
    });
  });

  it('applies Fragile only when the blocked type is absent from the whole wall', () => {
    const absentPlayer = createPlayerWithWall([
      [0, 3, 'Frost'],
      [1, 2, 'Wind'],
    ]);
    const presentPlayer = createPlayerWithWall([
      [0, 3, 'Frost'],
      [1, 0, 'Fire'],
    ]);
    const rune = createTestRuneWithEffects('fragile-frost', 'Frost', [
      { type: 'Fragile', amount: 5, fragileType: 'Fire', rarity: 'uncommon' },
    ]);

    expect(resolveCompletedRuneCastEffects({
      player: absentPlayer,
      enemy: createTestEnemy(20),
      rune,
    }).enemy?.health).toBe(15);
    expect(resolveCompletedRuneCastEffects({
      player: presentPlayer,
      enemy: createTestEnemy(20),
      rune,
    }).enemy?.health).toBe(20);
  });

  it('combines advanced effects with basic effects in ref order', () => {
    const player = {
      ...createPlayerWithWall([
        [0, 4, 'Void'],
        [1, 4, 'Void'],
        [2, 3, 'Frost'],
      ]),
      armor: 0,
    };
    const rune = createTestRuneWithEffects('advanced-mixed', 'Void', [
      { type: 'Damage', amount: 1, rarity: 'common' },
      { type: 'Synergy', amount: 2, synergyType: 'Void', rarity: 'uncommon' },
      { type: 'ArmorSynergy', amount: 3, synergyType: 'Frost', rarity: 'rare' },
      { type: 'Fragile', amount: 4, fragileType: 'Life', rarity: 'uncommon' },
      { type: 'Fortune', amount: 5, rarity: 'common' },
    ]);

    const result = resolveCompletedRuneCastEffects({ player, enemy: createTestEnemy(20), rune });

    expect(result.enemy?.health).toBe(9);
    expect(result.player.armor).toBe(3);
    expect(result.arcaneDustDelta).toBe(5);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'cast.damage',
      'cast.synergy',
      'cast.armorSynergy',
      'cast.fragile',
      'cast.fortune',
    ]);
  });

  it('logs unknown refs without changing state', () => {
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const enemy = createTestEnemy(10);
    const rune = {
      ...createTestRune('unknown-rune', 'Fire'),
      castEffectRefs: [{ effectId: 'legacy.unknown', params: { amount: 999 } }],
    };

    const result = resolveCompletedRuneCastEffects({ player, enemy, rune });

    expect(result.player).toBe(player);
    expect(result.enemy).toBe(enemy);
    expect(result.arcaneDustDelta).toBe(0);
    expect(result.logs).toMatchObject([
      {
        effectId: 'legacy.unknown',
        displayHint: 'unknown',
        output: { noOp: true },
      },
    ]);
  });

  it('applies Rod, Potion, and Tome passives through completed rune effects', () => {
    const player = {
      ...createPlayer('player-1', 'Tester', 10, [], 10),
      health: 4,
      armor: 1,
    };
    const enemy = createTestEnemy(20);
    const rune = createTestRuneWithEffects('artefact-combat-rune', 'Life', [
      { type: 'Damage', amount: 3, rarity: 'common' },
      { type: 'Healing', amount: 4, rarity: 'common' },
      { type: 'Armor', amount: 2, rarity: 'common' },
    ]);

    const result = resolveCompletedRuneCastEffects({
      player,
      enemy,
      rune,
      activeArtefacts: ['tome', 'rod', 'potion'],
    });

    expect(result.enemy?.health).toBe(16);
    expect(result.player.health).toBe(10);
    expect(result.player.armor).toBe(5);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'cast.damage',
      'cast.healing',
      'cast.armor',
      'passive.tomeCastDamage',
      'passive.rodHealing',
      'passive.potionArmor',
    ]);
  });

  it('applies Potion to armor synergy and Tome before final damage application', () => {
    const player = {
      ...createPlayerWithWall([
        [0, 3, 'Frost'],
        [1, 3, 'Frost'],
      ]),
      armor: 1,
    };
    const enemy = createTestEnemy(10);
    const rune = createTestRuneWithEffects('artefact-synergy-rune', 'Frost', [
      { type: 'Damage', amount: 1, rarity: 'common' },
      { type: 'ArmorSynergy', amount: 2, synergyType: 'Frost', rarity: 'rare' },
    ]);

    const result = resolveCompletedRuneCastEffects({
      player,
      enemy,
      rune,
      activeArtefacts: ['tome', 'potion'],
    });

    expect(result.enemy?.health).toBe(8);
    expect(result.player.armor).toBe(13);
    expect(result.logs).toMatchObject([
      { effectId: 'cast.damage', output: { damage: 1, enemyHealth: 9 } },
      { effectId: 'cast.armorSynergy', output: { armor: 6, playerArmor: 7 } },
      { effectId: 'passive.tomeCastDamage', output: { previousValue: 1, nextValue: 2 } },
      { effectId: 'passive.potionArmor', output: { previousValue: 6, nextValue: 12 } },
    ]);
  });

  it('enemy attack consumes armor before health', () => {
    const player = {
      ...createPlayer('player-1', 'Tester', 10, [], 10),
      health: 10,
      armor: 3,
    };

    const result = resolveEnemyTurn({ player, enemy: createTestEnemy(10, 5) });

    expect(result.player.armor).toBe(0);
    expect(result.player.health).toBe(8);
    expect(result.healthDamage).toBe(2);
  });

  it('reduces enemy attack damage before armor', () => {
    const player = {
      ...createPlayerWithWall([[0, 0, 'Frost']]),
      health: 10,
      armor: 3,
    };
    player.wall[0][0] = createWallCell('Frost', [createEffectRef('passive.reduceDamage', { amount: 4 })]);

    const result = resolveEnemyTurn({ player, enemy: createTestEnemy(10, 8) });

    expect(result.player.armor).toBe(0);
    expect(result.player.health).toBe(9);
    expect(result.healthDamage).toBe(1);
  });

  it('lethal enemy attack reaches zero health', () => {
    const player = {
      ...createPlayer('player-1', 'Tester', 10, [], 10),
      health: 4,
      armor: 0,
    };

    const result = resolveEnemyTurn({ player, enemy: createTestEnemy(10, 5) });

    expect(result.player.health).toBe(0);
    expect(result.healthDamage).toBe(5);
  });

  it('reports zero health damage when armor fully absorbs enemy attack', () => {
    const player = {
      ...createPlayer('player-1', 'Tester', 10, [], 10),
      health: 10,
      armor: 6,
    };

    const result = resolveEnemyTurn({ player, enemy: createTestEnemy(10, 5) });

    expect(result.player.armor).toBe(1);
    expect(result.player.health).toBe(10);
    expect(result.healthDamage).toBe(0);
  });

  it('reports zero health damage when passives reduce enemy attack to zero', () => {
    const player = {
      ...createPlayerWithWall([[0, 0, 'Frost']]),
      health: 10,
      armor: 0,
    };
    player.wall[0][0] = createWallCell('Frost', [createEffectRef('passive.reduceDamage', { amount: 5 })]);

    const result = resolveEnemyTurn({ player, enemy: createTestEnemy(10, 5) });

    expect(result.player.health).toBe(10);
    expect(result.healthDamage).toBe(0);
  });
});

describe('combatResolution victory deck collection', () => {
  it('returns draw deck, hand, discard, completed wall, and spent charge runes', () => {
    const drawRune = createTestRune('victory-draw', 'Fire');
    const handRune = createTestRune('victory-hand', 'Life');
    const discardRune = createTestRune('victory-discard', 'Void');
    const incompleteSpentRune = createTestRune('victory-incomplete-spent', 'Frost');
    const completedRune = createTestRuneWithEffects('victory-completed', 'Fire', [
      { type: 'Damage', amount: 3, rarity: 'common' },
    ]);
    const player = createPlayer('player-1', 'Tester', 10, [drawRune], 10);
    const wallCharges = createEmptyWallCharges(6);
    const wall = player.wall.map((row) => [...row]);
    wall[1][1] = {
      runeType: completedRune.runeType,
      rarity: completedRune.rarity,
      castEffectRefs: completedRune.castEffectRefs,
      passiveEffectRefs: completedRune.passiveEffectRefs,
    };
    wallCharges[1][1] = {
      ...wallCharges[1][1],
      currentCount: 2,
      spentRunes: [],
      completedRuneId: completedRune.id,
    };
    wallCharges[2][2] = {
      ...wallCharges[2][2],
      currentCount: 1,
      spentRunes: [incompleteSpentRune],
    };

    const result = collectVictoryDeck({
      player: {
        ...player,
        wall,
      },
      hand: [handRune],
      discardPile: [discardRune],
      wallCharges,
    });

    expect(result.player.deck.map((rune) => rune.id)).toEqual([
      'victory-draw',
      'victory-hand',
      'victory-discard',
      'victory-completed',
      'victory-incomplete-spent',
    ]);
    expect(result.hand).toEqual([]);
    expect(result.discardPile).toEqual([]);
  });

  it('returns suppressed runes after encounter recovery', () => {
    const suppressedRune = createTestRune('suppressed-void', 'Void');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);

    const result = collectVictoryDeck({
      player,
      hand: [],
      discardPile: [],
      suppressedRunes: [suppressedRune],
      wallCharges: createEmptyWallCharges(6),
    });

    expect(result.player.deck.map((rune) => rune.id)).toEqual(['suppressed-void']);
  });

  it('prefers suppressed originals over converted wall placeholders on recovery', () => {
    const originalRune = {
      ...createTestRune('converted-original', 'Fire'),
      castEffectRefs: [createEffectRef('cast.damage', { amount: 9 })],
    };
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wall = player.wall.map((row) => [...row]);
    const wallCharges = createEmptyWallCharges(6);
    wall[0][0] = {
      runeType: 'Frost',
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };
    wallCharges[0][0] = {
      ...wallCharges[0][0],
      currentCount: 1,
      completedRuneId: originalRune.id,
    };

    const result = collectVictoryDeck({
      player: { ...player, wall },
      hand: [],
      discardPile: [],
      suppressedRunes: [originalRune],
      wallCharges,
    });

    expect(result.player.deck).toEqual([originalRune]);
  });

  it('does not duplicate cards returned from multiple combat zones', () => {
    const duplicateRune = createTestRune('duplicate-rune', 'Fire');
    const player = createPlayer('player-1', 'Tester', 10, [duplicateRune], 10);

    const result = collectVictoryDeck({
      player,
      hand: [duplicateRune],
      discardPile: [duplicateRune],
      wallCharges: createEmptyWallCharges(6),
    });

    expect(result.player.deck.map((rune) => rune.id)).toEqual(['duplicate-rune']);
  });
});

function createTestRune(id: string, runeType: Rune['runeType']): Rune {
  return createTestRuneWithEffects(id, runeType, [{ type: 'Damage', amount: 1, rarity: 'common' }]);
}

function createTestRuneWithEffects(id: string, runeType: Rune['runeType'], effects: unknown[]): Rune {
  return {
    id,
    runeType,
    rarity: 'common',
    castEffectRefs: effects.map(toCatalogEffectRef),
    passiveEffectRefs: [],
  };
}

function toCatalogEffectRef(effect: unknown): Rune['castEffectRefs'][number] {
  if (!effect || typeof effect !== 'object') {
    return { effectId: 'legacy.invalid' };
  }

  const candidate = effect as {
    type?: string;
    amount?: number;
    synergyType?: RuneType;
    fragileType?: RuneType;
  };

  switch (candidate.type) {
    case 'Damage':
      return createEffectRef('cast.damage', { amount: candidate.amount ?? 0 });
    case 'Healing':
      return createEffectRef('cast.healing', { amount: candidate.amount ?? 0 });
    case 'Armor':
      return createEffectRef('cast.armor', { amount: candidate.amount ?? 0 });
    case 'Fortune':
      return createEffectRef('cast.fortune', { amount: candidate.amount ?? 0 });
    case 'Synergy':
      return createEffectRef('cast.synergy', { amount: candidate.amount ?? 0, synergyType: candidate.synergyType });
    case 'ArmorSynergy':
      return createEffectRef('cast.armorSynergy', { amount: candidate.amount ?? 0, synergyType: candidate.synergyType });
    case 'Fragile':
      return createEffectRef('cast.fragile', { amount: candidate.amount ?? 0, fragileType: candidate.fragileType });
    default:
      return { effectId: 'legacy.unknown' };
  }
}

function createRunes(prefix: string, count: number): Rune[] {
  return Array.from({ length: count }, (_, index) => createTestRune(`${prefix}-${index}`, 'Fire'));
}

function createTestEnemy(health: number, attack: number = 5): Enemy {
  return {
    id: 'test-enemy',
    name: 'Test Enemy',
    imageSrc: '',
    health,
    maxHealth: 10,
    intent: { type: 'Attack', amount: attack },
  };
}

function createPlayerWithWall(cells: Array<[number, number, Rune['runeType']]>): ReturnType<typeof createPlayer> {
  const player = createPlayer('player-1', 'Tester', 10, [], 10);
  const wall = player.wall.map((row) => row.map((cell) => ({ ...cell })));
  cells.forEach(([row, col, runeType]) => {
    wall[row][col] = createWallCell(runeType);
  });
  return {
    ...player,
    wall,
  };
}

function createWallCell(runeType: RuneType, passiveEffectRefs: Rune['passiveEffectRefs'] = []): WallCell {
  return {
    runeType,
    rarity: 'common',
    castEffectRefs: [],
    passiveEffectRefs,
  };
}
