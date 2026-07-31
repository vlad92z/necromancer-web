import { describe, expect, it } from 'vitest';
import type { EnemyRune } from '../types/game';
import {
  createEmptyWall,
  createEnemySpellBoard,
  createEnemyTurnRunes,
  createPlayer,
  initializeSoloGame,
} from './gameInitialization';
import { resolveEnemyTurn } from './combatResolution';
import { resolveCastEffects } from './effectResolver';
import { createRuneFromPool } from './runeEffects';

function createEnemyRune(id: string, damage: number): EnemyRune {
  return {
    id,
    name: 'Life Test',
    runeTypes: ['Life'],
    rarity: 'common',
    cardImageSrc: 'life-card.png',
    tokenImageSrc: 'life-token.png',
    castEffectRefs: [],
    passiveEffectRefs: [],
    damage,
  };
}

describe('enemy spellboard combat', () => {
  it('initializes a hidden enemy queue and Life-slot board', () => {
    const state = initializeSoloGame();

    expect(state.enemyBoard).toHaveLength(6);
    expect(state.enemyBoard.flat()).toHaveLength(36);
    expect(state.enemyBoard.flat().every((cell) => cell.id === null)).toBe(true);
    expect(state.enemyBoard.flat().every((cell) => (
      cell.acceptedRuneTypes.length === 1 && cell.acceptedRuneTypes[0] === 'Life'
    ))).toBe(true);
    expect(state.enemyQueuedRunes).toEqual([]);
    expect(createEnemyTurnRunes(4).map((rune) => rune.name)).toEqual(['Throw Rock', 'Throw Rock', 'Throw Rock', 'Hide']);
    expect(createEnemyTurnRunes(4).map((rune) => rune.runeTypes[0])).toEqual(['Life', 'Life', 'Life', 'Life']);
    expect(createEnemyTurnRunes(4).map((rune) => rune.damage)).toEqual([3, 3, 3, 0]);
    expect(createEnemyTurnRunes(4)[0]?.cardImageSrc).toContain('card_throw_rock.png');
    expect(createEnemyTurnRunes(4)[0]?.tokenImageSrc).toContain('token_life.png');
    expect(createEnemyTurnRunes(4)[0]?.castEffectRefs).toEqual([
      { effectId: 'cast.damage', params: { amount: 3 } },
    ]);
    expect(createEnemyTurnRunes(4)[3]).toMatchObject({
      name: 'Hide',
      manaCost: 1,
      cardImageSrc: expect.stringContaining('card_barricade.png'),
      castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
    });
  });

  it('plays queued runes in order into random open slots and applies each damage', () => {
    const player = { ...createPlayer('player-1', 'Tester', 20, [], 20), armor: 1 };
    const queuedRunes = [createEnemyRune('first', 1), createEnemyRune('second', 2), createEnemyRune('third', 3)];
    const result = resolveEnemyTurn({
      player,
      enemy: initializeSoloGame().enemy,
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: queuedRunes,
      random: () => 0,
    });

    expect(result.enemyQueuedRunes).toEqual([]);
    expect(result.enemyBoard[0].slice(0, 3).map((cell) => cell.id)).toEqual(['first', 'second', 'third']);
    expect(result.player.armor).toBe(0);
    expect(result.player.health).toBe(15);
    expect(result.healthDamage).toBe(5);
  });

  it('gives the Goblin armor when Hide is placed', () => {
    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: initializeSoloGame().enemy,
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: [createEnemyTurnRunes(0)[3]!],
      random: () => 0,
    });

    expect(result.enemy?.armor).toBe(3);
  });

  it('has Goblin armor absorb player damage before health', () => {
    const goblin = { ...initializeSoloGame().enemy!, armor: 5 };
    const result = resolveCastEffects({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: goblin,
      castRune: createRuneFromPool({ id: 'firebolt', runeType: 'Fire', rarity: 'common', random: () => 0 }),
      wall: createEmptyWall(),
    });

    expect(result.enemy).toMatchObject({ health: 20, armor: 0 });
  });

  it('applies damage reduction independently to each enemy card', () => {
    const wall = createEmptyWall();
    wall[0][0] = {
      ...wall[0][0],
      id: 'headwind-wall-copy',
      name: 'Headwind',
      runeTypes: ['Wind'],
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.reduceDamage', params: { amount: 1 } }],
    };
    const player = {
      ...createPlayer('player-1', 'Tester', 20, [], 20),
      wall,
    };

    const result = resolveEnemyTurn({
      player,
      enemy: initializeSoloGame().enemy,
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: [createEnemyRune('attacker-1', 3), createEnemyRune('attacker-2', 3)],
      random: () => 0,
    });

    expect(result.player.health).toBe(16);
    expect(result.healthDamage).toBe(4);
    expect(result.logs.filter((log) => log.effectId === 'passive.reduceDamage')).toHaveLength(2);
  });

  it('resolves enemy board start and end turn effects around card plays', () => {
    const board = createEnemySpellBoard();
    board[0][0] = {
      ...board[0][0],
      id: 'enemy-regeneration',
      name: 'Regeneration',
      runeTypes: ['Life'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [
        { effectId: 'passive.healingStartTurn', params: { amount: 3 } },
        { effectId: 'passive.damageEndTurn', params: { amount: 2 } },
      ],
    };
    const enemy = { ...initializeSoloGame().enemy!, health: 10, armor: 0 };

    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy,
      enemyBoard: board,
      enemyQueuedRunes: [createEnemyRune('enemy-card', 1)],
      random: () => 0,
    });

    expect(result.enemy?.health).toBe(13);
    expect(result.player.health).toBe(17);
    expect(result.healthDamage).toBe(3);
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'passive.healingStartTurn',
      'passive.damageEndTurn',
    ]);
  });

  it('fills the last slot and reports an enemy board win condition', () => {
    const board = createEnemySpellBoard();
    board.flat().forEach((cell, index) => {
      if (index < 35) {
        cell.id = `filled-${index}`;
        cell.runeTypes[0] = 'Life';
        cell.rarity = 'common';
        cell.castEffectRefs = [];
        cell.passiveEffectRefs = [];
      }
    });

    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: initializeSoloGame().enemy,
      enemyBoard: board,
      enemyQueuedRunes: [createEnemyRune('last', 1)],
      random: () => 0,
    });

    expect(result.boardFull).toBe(true);
    expect(result.enemyBoard.flat().map((cell) => cell.id)).toContain('last');
  });
});
