import { describe, expect, it } from 'vitest';
import type { Enemy, Rune, RuneType, WallCell } from '../types/game';
import { createEffectRef } from './effectCatalog';
import { createPlayer } from './gameInitialization';
import {
  castRuneToWallSlot,
  collectVictoryDeck,
  countFilledWallRunesByType,
  drawRunes,
  drawRunesOfType,
  endPlayerTurn,
  resolveCompletedRuneCastEffects,
  wallHasRuneType,
} from './combatResolution';

describe('combatResolution wall casting', () => {
  it.each(['common', 'uncommon', 'rare', 'epic'] as const)(
    'places a %s rune immediately and resolves it as completed',
    (rarity) => {
    const fireRune = createTestRune(`fire-${rarity}`, 'Fire', rarity);
    const player = createPlayer('player-1', 'Tester', 10, [], 10);

    const result = castRuneToWallSlot({
      player,
      hand: [fireRune],
      discardPile: [],
      selectedHandRuneId: fireRune.id,
      row: 0,
      col: 0,
      createCompletedRuneId: () => `wall-copy-${rarity}`,
    });

    expect(result.status).toBe('completed');
    expect(result.hand).toEqual([]);
    expect(result.discardPile).toEqual([fireRune]);
    expect(result.selectedHandRuneId).toBeNull();
    expect(result.player.wall[0][0]).toEqual({
      id: `wall-copy-${rarity}`,
      acceptedRuneTypes: ['Fire'],
      runeTypes: ['Fire'],
      rarity,
      castEffectRefs: fireRune.castEffectRefs,
      passiveEffectRefs: fireRune.passiveEffectRefs,
    });
    expect(result.completedRune?.id).toBe(`wall-copy-${rarity}`);
    expect(result.completedPosition).toEqual({ row: 0, col: 0 });
  });

  it('rejects casts whose rune types do not satisfy the slot', () => {
    const lifeRune = createTestRune('life-wrong-type', 'Life');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const result = castRuneToWallSlot({
      player,
      hand: [lifeRune],
      discardPile: [],
      selectedHandRuneId: lifeRune.id,
      row: 0,
      col: 0,
    });

    expect(result.status).toBe('invalid');
    expect(result.hand).toEqual([lifeRune]);
    expect(result.discardPile).toEqual([]);
    expect(result.selectedHandRuneId).toBe(lifeRune.id);
  });

  it('rejects casts into filled slots without clearing selection', () => {
    const fireRune = createTestRune('fire-filled', 'Fire');
    const secondRune = createTestRune('fire-rejected', 'Fire');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    player.wall[0][0] = {
      ...player.wall[0][0],
      id: fireRune.id,
      runeTypes: [...fireRune.runeTypes],
      rarity: fireRune.rarity,
      castEffectRefs: fireRune.castEffectRefs,
      passiveEffectRefs: fireRune.passiveEffectRefs,
    };

    const result = castRuneToWallSlot({
      player,
      hand: [secondRune],
      discardPile: [],
      selectedHandRuneId: secondRune.id,
      row: 0,
      col: 0,
    });

    expect(result.status).toBe('invalid');
    expect(result.selectedHandRuneId).toBe(secondRune.id);
  });

  it('creates distinct wall-copy ids for repeated completions of the same rune concept', () => {
    const firstRune = createTestRune('shared-concept', 'Fire', 'common');
    const secondRune = createTestRune('shared-concept', 'Fire', 'common');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const firstResult = castRuneToWallSlot({
      player,
      hand: [firstRune],
      discardPile: [],
      selectedHandRuneId: firstRune.id,
      row: 0,
      col: 0,
      createCompletedRuneId: () => 'wall-copy-first',
    });
    const secondResult = castRuneToWallSlot({
      player: firstResult.player,
      hand: [secondRune],
      discardPile: firstResult.discardPile,
      selectedHandRuneId: secondRune.id,
      row: 1,
      col: 5,
      createCompletedRuneId: () => 'wall-copy-second',
    });

    expect(firstResult.player.wall[0][0].id).toBe('wall-copy-first');
    expect(secondResult.player.wall[1][5].id).toBe('wall-copy-second');
    expect(firstResult.player.wall[0][0].id).not.toBe(secondResult.player.wall[1][5].id);
  });

  it('accepts a multi-type rune when any type matches a multi-type slot', () => {
    const rune = { ...createTestRune('hybrid', 'Fire'), runeTypes: ['Fire', 'Wind'] as RuneType[] };
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    player.wall[0][0].acceptedRuneTypes = ['Life', 'Wind'];

    const result = castRuneToWallSlot({
      player,
      hand: [rune],
      discardPile: [],
      selectedHandRuneId: rune.id,
      row: 0,
      col: 0,
    });

    expect(result.status).toBe('completed');
    expect(result.player.wall[0][0].runeTypes).toEqual(['Fire', 'Wind']);
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

});

describe('combatResolution victory deck collection', () => {
  it('clears encounter zones without rebuilding the persistent deck', () => {
    const drawRune = createTestRune('victory-draw', 'Fire');
    const handRune = createTestRune('victory-hand', 'Life');
    const discardRune = createTestRune('victory-discard', 'Void');
    const completedRune = createTestRuneWithEffects('victory-completed', 'Fire', [
      { type: 'Damage', amount: 3, rarity: 'common' },
    ]);
    const player = createPlayer('player-1', 'Tester', 10, [drawRune], 10);
    const wall = player.wall.map((row) => [...row]);
    wall[1][1] = {
      ...wall[1][1],
      id: completedRune.id,
      runeTypes: [...completedRune.runeTypes],
      rarity: completedRune.rarity,
      castEffectRefs: completedRune.castEffectRefs,
      passiveEffectRefs: completedRune.passiveEffectRefs,
    };
    const result = collectVictoryDeck({
      player: {
        ...player,
        wall,
      },
      hand: [handRune],
      discardPile: [discardRune],
    });

    expect(result.player.deck).toEqual([drawRune]);
    expect(result.hand).toEqual([]);
    expect(result.discardPile).toEqual([]);
  });

  it('does not persist suppressed runes into the base deck on victory cleanup', () => {
    const suppressedRune = createTestRune('suppressed-void', 'Void');
    const player = createPlayer('player-1', 'Tester', 10, [], 10);

    const result = collectVictoryDeck({
      player,
      hand: [],
      discardPile: [],
      suppressedRunes: [suppressedRune],
    });

    expect(result.player.deck).toEqual([]);
  });

  it('does not inject converted wall placeholders or suppressed originals into the base deck', () => {
    const originalRune = {
      ...createTestRune('converted-original', 'Fire'),
      castEffectRefs: [createEffectRef('cast.damage', { amount: 9 })],
    };
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const wall = player.wall.map((row) => [...row]);
    wall[0][0] = {
    ...wall[0][0],
      id: originalRune.id,
      runeTypes: ['Frost'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };
    const result = collectVictoryDeck({
      player: { ...player, wall },
      hand: [],
      discardPile: [],
      suppressedRunes: [originalRune],
    });

    expect(result.player.deck).toEqual([]);
  });

  it('preserves the existing base deck without adding duplicates from encounter zones', () => {
    const duplicateRune = createTestRune('duplicate-rune', 'Fire');
    const player = createPlayer('player-1', 'Tester', 10, [duplicateRune], 10);

    const result = collectVictoryDeck({
      player,
      hand: [duplicateRune],
      discardPile: [duplicateRune],
    });

    expect(result.player.deck.map((rune) => rune.id)).toEqual(['duplicate-rune']);
  });
});

function createTestRune(id: string, runeType: RuneType, rarity: Rune['rarity'] = 'common'): Rune {
  return createTestRuneWithEffects(id, runeType, [{ type: 'Damage', amount: 1, rarity }], rarity);
}

function createTestRuneWithEffects(
  id: string,
  runeType: RuneType,
  effects: unknown[],
  rarity: Rune['rarity'] = 'common'
): Rune {
  return {
    id,
    runeTypes: [runeType],
    rarity,
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

function createTestEnemy(health: number): Enemy {
  return {
    id: 'test-enemy',
    name: 'Test Enemy',
    imageSrc: '',
    health,
    maxHealth: 10,
  };
}

function createPlayerWithWall(cells: Array<[number, number, RuneType]>): ReturnType<typeof createPlayer> {
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
    id: `completed-${runeType}`,
    acceptedRuneTypes: [runeType],
    runeTypes: [runeType],
    rarity: 'common',
    castEffectRefs: [],
    passiveEffectRefs,
  };
}
