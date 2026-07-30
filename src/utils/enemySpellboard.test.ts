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
    expect(createEnemyTurnRunes(4).map((rune) => rune.name)).toEqual(['Tornado', 'Tornado', 'Barricade']);
    expect(createEnemyTurnRunes(4).map((rune) => rune.runeTypes[0])).toEqual(['Wind', 'Wind', 'Life']);
    expect(createEnemyTurnRunes(4).map((rune) => rune.damage)).toEqual([5, 5, 0]);
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

  it('reduces total incoming enemy-turn damage before armor', () => {
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
      enemyQueuedRunes: [createEnemyRune('attacker', 3)],
      random: () => 0,
    });

    expect(result.player.health).toBe(18);
    expect(result.healthDamage).toBe(2);
    expect(result.logs.map((log) => log.effectId)).toContain('passive.reduceDamage');
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
