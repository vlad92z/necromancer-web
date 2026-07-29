import { describe, expect, it } from 'vitest';
import type { EnemyRune } from '../types/game';
import {
  createEmptyWall,
  createEnemyTurnRunes,
  createPlayer,
  initializeSoloGame,
} from './gameInitialization';
import { resolveEnemyTurn } from './combatResolution';

function createEnemyRune(id: string, damage: number): EnemyRune {
  return {
    id,
    runeType: 'Life',
    rarity: 'common',
    castEffectRefs: [],
    passiveEffectRefs: [],
    damage,
  };
}

describe('enemy spellboard combat', () => {
  it('initializes a hidden enemy queue and empty board', () => {
    const state = initializeSoloGame();

    expect(state.enemyBoard).toHaveLength(6);
    expect(state.enemyBoard.flat()).toHaveLength(36);
    expect(state.enemyBoard.flat().every((cell) => cell.id === null)).toBe(true);
    expect(state.enemyQueuedRunes).toEqual([]);
    expect(createEnemyTurnRunes(4).map((rune) => rune.runeType)).toEqual(['Life', 'Life', 'Life']);
    expect(createEnemyTurnRunes(4).map((rune) => rune.damage)).toEqual([1, 1, 1]);
  });

  it('plays queued runes in order into random open slots and applies each damage', () => {
    const player = { ...createPlayer('player-1', 'Tester', 20, [], 20), armor: 1 };
    const queuedRunes = [createEnemyRune('first', 1), createEnemyRune('second', 2), createEnemyRune('third', 3)];
    const result = resolveEnemyTurn({
      player,
      enemy: initializeSoloGame().enemy,
      enemyBoard: createEmptyWall(),
      enemyQueuedRunes: queuedRunes,
      random: () => 0,
    });

    expect(result.enemyQueuedRunes).toEqual([]);
    expect(result.enemyBoard[0].slice(0, 3).map((cell) => cell.id)).toEqual(['first', 'second', 'third']);
    expect(result.player.armor).toBe(0);
    expect(result.player.health).toBe(15);
    expect(result.healthDamage).toBe(5);
  });

  it('fills the last slot and reports an enemy board win condition', () => {
    const board = createEmptyWall();
    board.flat().forEach((cell, index) => {
      if (index < 35) {
        cell.id = `filled-${index}`;
        cell.runeType = 'Life';
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
