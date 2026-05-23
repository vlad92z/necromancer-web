import { describe, expect, it } from 'vitest';
import type { Enemy, Rune, RuneType, WallCell } from '../types/game';
import { createEmptyWallCharges, createPlayer } from './gameInitialization';
import {
  castRuneToWallSlot,
  collectVictoryDeck,
  countFilledWallRunesByType,
  endPlayerTurn,
  resolveCompletedRuneEffects,
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
      rarity: finalRune.rarity,
      castEffectRefs: finalRune.castEffectRefs,
      passiveEffectRefs: finalRune.passiveEffectRefs,
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

describe('combatResolution turn cycling', () => {
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
  it('leaves damage refs unresolved during Stage 1 cutover', () => {
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const enemy = createTestEnemy(10);
    const rune = createTestRuneWithEffects('damage-rune', 'Fire', [
      { type: 'Damage', amount: 3, rarity: 'common' },
    ]);

    const result = resolveCompletedRuneEffects({ player, enemy, rune });

    expect(result.enemy?.health).toBe(10);
    expect(result.player).toBe(player);
    expect(result.arcaneDustDelta).toBe(0);
  });

  it('leaves healing and armor refs unresolved during Stage 1 cutover', () => {
    const player = {
      ...createPlayer('player-1', 'Tester', 10, [], 10),
      health: 8,
      armor: 1,
    };
    const rune = createTestRuneWithEffects('support-rune', 'Life', [
      { type: 'Healing', amount: 5, rarity: 'common' },
      { type: 'Armor', amount: 2, rarity: 'common' },
    ]);

    const result = resolveCompletedRuneEffects({ player, enemy: createTestEnemy(10), rune });

    expect(result.player.health).toBe(8);
    expect(result.player.armor).toBe(1);
  });

  it('keeps fortune and channel refs unresolved during Stage 1 cutover', () => {
    const player = createPlayer('player-1', 'Tester', 10, [], 10);
    const enemy = createTestEnemy(10);
    const rune = createTestRuneWithEffects('mixed-rune', 'Wind', [
      { type: 'Fortune', amount: 4, rarity: 'common' },
      { type: 'Channel', amount: 9, rarity: 'common' },
      { type: 'ChannelSynergy', amount: 9, synergyType: 'Lightning', rarity: 'common' },
    ]);

    const result = resolveCompletedRuneEffects({ player, enemy, rune });

    expect(result.arcaneDustDelta).toBe(0);
    expect(result.player).toBe(player);
    expect(result.enemy).toBe(enemy);
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

  it('leaves Synergy refs unresolved during Stage 1 cutover', () => {
    const player = createPlayerWithWall([
      [0, 4, 'Void'],
      [1, 4, 'Void'],
      [2, 0, 'Fire'],
    ]);
    const enemy = createTestEnemy(20);
    const rune = createTestRuneWithEffects('void-synergy', 'Void', [
      { type: 'Synergy', amount: 2, synergyType: 'Void', rarity: 'uncommon' },
    ]);

    const result = resolveCompletedRuneEffects({ player, enemy, rune });

    expect(result.enemy?.health).toBe(20);
    expect(result.player).toBe(player);
  });

  it('leaves ArmorSynergy refs unresolved during Stage 1 cutover', () => {
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

    const result = resolveCompletedRuneEffects({ player, enemy: createTestEnemy(20), rune });

    expect(result.player.armor).toBe(1);
  });

  it('leaves Fragile refs unresolved during Stage 1 cutover', () => {
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

    expect(resolveCompletedRuneEffects({
      player: absentPlayer,
      enemy: createTestEnemy(20),
      rune,
    }).enemy?.health).toBe(20);
    expect(resolveCompletedRuneEffects({
      player: presentPlayer,
      enemy: createTestEnemy(20),
      rune,
    }).enemy?.health).toBe(20);
  });

  it('leaves mixed refs unresolved during Stage 1 cutover', () => {
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

    const result = resolveCompletedRuneEffects({ player, enemy: createTestEnemy(20), rune });

    expect(result.enemy?.health).toBe(20);
    expect(result.player.armor).toBe(0);
    expect(result.arcaneDustDelta).toBe(0);
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
  });

  it('lethal enemy attack reaches zero health', () => {
    const player = {
      ...createPlayer('player-1', 'Tester', 10, [], 10),
      health: 4,
      armor: 0,
    };

    const result = resolveEnemyTurn({ player, enemy: createTestEnemy(10, 5) });

    expect(result.player.health).toBe(0);
  });
});

describe('combatResolution victory deck collection', () => {
  it('returns draw deck, hand, discard, completed wall, and spent charge runes', () => {
    const drawRune = createTestRune('victory-draw', 'Fire');
    const handRune = createTestRune('victory-hand', 'Life');
    const discardRune = createTestRune('victory-discard', 'Void');
    const spentRune = createTestRune('victory-spent', 'Fire');
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
      spentRunes: [spentRune],
      completedRuneId: completedRune.id,
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
      'victory-spent',
      'victory-completed',
    ]);
    expect(result.hand).toEqual([]);
    expect(result.discardPile).toEqual([]);
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
    castEffectRefs: effects.map((effect, index) => ({
      effectId: `legacy-test-effect-${index}`,
      params: { effect },
    })),
    passiveEffectRefs: [],
  };
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

function createWallCell(runeType: RuneType): WallCell {
  return {
    runeType,
    rarity: 'common',
    castEffectRefs: [],
    passiveEffectRefs: [],
  };
}
