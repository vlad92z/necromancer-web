import { describe, expect, it } from 'vitest';
import type { EnemyRune, ScoringWall } from '../types/game';
import {
  createEmptyWall,
  createEnemySpellBoard,
  createEnemyTurnRunes,
  createMonsterEnemy,
  createPlayer,
  initializeSoloGame,
} from './gameInitialization';
import { resolveEnemyTurn } from './combatResolution';
import { createEffectRef } from './effectCatalog';
import { resolveCastEffects } from './effectResolver';
import { createRuneRemovalEffectRef } from './runeRemoval';
import { createRuneFromCardName } from './runeEffects';

const totalShield = (wall: ScoringWall) => wall.flat().reduce((total, cell) => total + (cell.shield ?? 0), 0);

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
  it('initializes a hidden enemy queue and neutral-slot board', () => {
    const state = initializeSoloGame();

    expect(state.enemyBoard).toHaveLength(6);
    expect(state.enemyBoard.flat()).toHaveLength(36);
    expect(state.enemyBoard.flat().every((cell) => cell.id === null)).toBe(true);
    expect(state.enemyBoard.flat().every((cell) => cell.runeTypes.length === 0)).toBe(true);
    expect(state.enemyQueuedRunes).toEqual([]);
    expect(createEnemyTurnRunes('goblin', 4).map((rune) => rune.name)).toEqual(['Throw Rock', 'Throw Rock', 'Throw Rock', 'Hide']);
    expect(createEnemyTurnRunes('goblin', 4).map((rune) => rune.runeTypes[0])).toEqual(['Life', 'Life', 'Life', 'Life']);
    expect(createEnemyTurnRunes('goblin', 4).map((rune) => rune.damage)).toEqual([3, 3, 3, 0]);
    expect(createEnemyTurnRunes('goblin', 4)[0]?.cardImageSrc).toContain('card_throw_rock.png');
    expect(createEnemyTurnRunes('goblin', 4)[0]?.tokenImageSrc).toContain('token_life.png');
    expect(createEnemyTurnRunes('goblin', 4)[0]?.castEffectRefs).toEqual([
      { effectId: 'cast.damage', params: { amount: 3 } },
    ]);
    expect(createEnemyTurnRunes('goblin', 4)[2]).toMatchObject({
      name: 'Hide',
      manaCost: 0,
      cardImageSrc: expect.stringContaining('card_hide.png'),
      castEffectRefs: [{
        effectId: 'rune.consume',
        trigger: 'onCast',
        selection: 'manual',
        payload: { effectId: 'cast.shield', params: { amount: 2 } },
      }],
    });
  });

  it('plays queued runes in order into random open slots and applies each damage', () => {
    const player = createPlayer('player-1', 'Tester', 20, [], 20);
    const queuedRunes = [createEnemyRune('first', 1), createEnemyRune('second', 2), createEnemyRune('third', 3)];
    const result = resolveEnemyTurn({
      player,
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: queuedRunes,
      random: () => 0,
    });

    expect(result.enemyQueuedRunes).toEqual([]);
    expect(result.enemyBoard[0].slice(0, 3).map((cell) => cell.id)).toEqual(['first', 'second', 'third']);
    expect(totalShield(result.player.wall)).toBe(0);
    expect(result.player.health).toBe(14);
    expect(result.healthDamage).toBe(6);
  });

  it('gives the Goblin shield when Hide is placed', () => {
    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: [createEnemyTurnRunes('goblin', 0)[0]!, createEnemyTurnRunes('goblin', 0)[2]!],
      random: () => 0,
    });

    expect(totalShield(result.enemyBoard)).toBe(2);
  });

  it('has Shade resolve each Shadow Bolt from the Void runes already on its spell wall', () => {
    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: createMonsterEnemy('shade'),
      enemyBoard: createEnemySpellBoard(),
      turnNumber: 0,
      random: () => 0,
    });

    expect(result.player.health).toBe(14);
    expect(result.healthDamage).toBe(6);
    expect(result.enemyBoard[0].slice(0, 2).map((cell) => cell.name)).toEqual(['Shadow Bolt', 'Shadow Bolt']);
    expect(result.enemy?.health).toBe(28);
  });

  it('has Goblin shield absorb player damage before health', () => {
    const goblin = createMonsterEnemy('goblin');
    const enemyBoard = createEmptyWall();
    enemyBoard[0]![0] = {
      ...enemyBoard[0]![0],
      id: 'shielded-enemy-rune',
      name: 'Frost Shield',
      runeTypes: ['Frost'],
      rarity: 'common',
      shield: 5,
    };
    const result = resolveCastEffects({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: goblin,
      castRune: createRuneFromCardName({ id: 'firebolt', cardName: 'Firebolt' }),
      wall: createEmptyWall(),
      opposingWall: enemyBoard,
    });

    expect(result.enemy?.health).toBe(goblin.health);
    expect(totalShield(result.opposingWall)).toBe(3);
  });

  it('has Headwind destroy another Wind rune for each incoming damage packet', () => {
    const wall = createEmptyWall();
    const headwind = createRuneFromCardName({ id: 'headwind', cardName: 'Headwind' });
    wall[0][0] = {
      ...wall[0][0],
      id: 'headwind-wall-copy',
      name: 'Headwind',
      runeTypes: ['Wind'],
      rarity: 'uncommon',
      cardImageSrc: headwind.cardImageSrc,
      tokenImageSrc: headwind.tokenImageSrc,
      castEffectRefs: headwind.castEffectRefs,
      passiveEffectRefs: headwind.passiveEffectRefs,
      shield: 5,
    };
    [1, 2].forEach((col) => {
      wall[0][col] = {
        ...wall[0][col],
        id: `wind-target-${col}`,
        name: 'Tornado',
        runeTypes: ['Wind'],
        rarity: 'common',
        cardImageSrc: 'wind-card.png',
        tokenImageSrc: 'wind-token.png',
        castEffectRefs: [],
        passiveEffectRefs: [],
      };
    });
    const player = {
      ...createPlayer('player-1', 'Tester', 20, [], 20),
      wall,
    };

    const result = resolveEnemyTurn({
      player,
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: [createEnemyRune('attacker-1', 3), createEnemyRune('attacker-2', 3)],
      random: () => 0,
    });

    expect(result.player.health).toBe(20);
    expect(result.healthDamage).toBe(0);
    expect(result.player.wall[0][0].id).toBe('headwind-wall-copy');
    expect(result.player.wall[0][1].id).toBeNull();
    expect(result.player.wall[0][2].id).toBeNull();
    expect(result.logs.filter((log) => log.effectId === 'rune.destroy')).toHaveLength(2);
  });

  it('skips a Headwind that was destroyed by an earlier Headwind in the same damage packet', () => {
    const wall = createEmptyWall();
    const headwind = createRuneFromCardName({ id: 'headwind', cardName: 'Headwind' });
    [0, 1].forEach((col) => {
      wall[0][col] = {
        ...wall[0][col],
        id: `headwind-${col}`,
        name: 'Headwind',
        runeTypes: ['Wind'],
        rarity: 'uncommon',
        cardImageSrc: headwind.cardImageSrc,
        tokenImageSrc: headwind.tokenImageSrc,
        castEffectRefs: [],
        passiveEffectRefs: headwind.passiveEffectRefs,
      };
    });

    const result = resolveEnemyTurn({
      player: { ...createPlayer('player-1', 'Tester', 20, [], 20), wall },
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: [createEnemyRune('attacker', 10)],
      random: () => 0,
    });

    expect(result.player.health).toBe(15);
    expect(result.logs.filter((log) => log.effectId === 'rune.destroy')).toHaveLength(1);
  });

  it('applies Headwind before shield and requires another Wind rune', () => {
    const headwind = createRuneFromCardName({ id: 'headwind', cardName: 'Headwind' });
    const wall = createEmptyWall();
    wall[0][0] = {
      ...wall[0][0],
      id: 'headwind-source',
      name: 'Headwind',
      runeTypes: ['Wind'],
      rarity: 'uncommon',
      cardImageSrc: headwind.cardImageSrc,
      tokenImageSrc: headwind.tokenImageSrc,
      castEffectRefs: [],
      passiveEffectRefs: headwind.passiveEffectRefs,
      shield: 5,
    };
    const withoutTarget = resolveEnemyTurn({
      player: { ...createPlayer('player-1', 'Tester', 20, [], 20), wall },
      enemy: createMonsterEnemy('goblin'),
      enemyQueuedRunes: [createEnemyRune('attacker-without-target', 7)],
      random: () => 0,
    });

    expect(withoutTarget.player.health).toBe(18);
    expect(withoutTarget.player.wall[0][0].id).toBeNull();
    expect(withoutTarget.logs).toContainEqual(expect.objectContaining({
      effectId: 'rune.destroy',
      output: expect.objectContaining({ noTarget: true }),
    }));

    wall[0][1] = {
      ...wall[0][1],
      id: 'wind-target',
      name: 'Tornado',
      runeTypes: ['Wind'],
      rarity: 'common',
      cardImageSrc: 'wind-card.png',
      tokenImageSrc: 'wind-token.png',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };
    const withTarget = resolveEnemyTurn({
      player: { ...createPlayer('player-1', 'Tester', 20, [], 20), wall },
      enemy: createMonsterEnemy('goblin'),
      enemyQueuedRunes: [createEnemyRune('attacker-with-target', 7)],
      random: () => 0,
    });

    expect(withTarget.player.health).toBe(20);
    expect(withTarget.player.wall[0][0].shield).toBe(3);
    expect(withTarget.player.wall[0][1].id).toBeNull();
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
    const enemy = { ...initializeSoloGame().enemy!, health: 10 };

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
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: board,
      enemyQueuedRunes: [createEnemyRune('last', 1)],
      random: () => 0,
    });

    expect(result.boardFull).toBe(true);
    expect(result.enemyBoard.flat().map((cell) => cell.id)).toContain('last');
  });

  it('destroys one random player-wall rune when Avalanche is played', () => {
    const player = createPlayer('player-1', 'Tester', 100, [createEnemyRune('deck-rune', 0)], 100);
    const originalDeck = player.deck;
    [0, 1].forEach((rowIndex) => {
      [0, 1].forEach((colIndex) => {
        player.wall[rowIndex][colIndex] = {
          ...player.wall[rowIndex][colIndex],
          id: `wall-${rowIndex}-${colIndex}`,
          name: 'Barricade',
          runeTypes: ['Life'],
          rarity: 'common',
          cardImageSrc: 'card.png',
          tokenImageSrc: 'token.png',
          manaCost: 3,
          castEffectRefs: [],
          passiveEffectRefs: [],
        };
      });
    });

    const result = resolveEnemyTurn({
      player,
      enemy: createMonsterEnemy('golem-lord'),
      enemyQueuedRunes: [createEnemyTurnRunes('golem-lord', 2)[0]!],
      random: () => 0,
    });

    expect(result.player.wall[0][0].id).toBeNull();
    expect(result.player.wall.flat().filter((cell) => cell.id !== null)).toHaveLength(3);
    expect(result.player.deck).toBe(originalDeck);
    expect(result.logs).toContainEqual(expect.objectContaining({
      effectId: 'rune.destroy',
      output: expect.objectContaining({ removedRuneId: 'wall-0-0', row: 0, col: 0 }),
    }));
  });

  it('does not change an empty player wall when Avalanche is played', () => {
    const player = createPlayer('player-1', 'Tester', 100, [], 100);
    const result = resolveEnemyTurn({
      player,
      enemy: createMonsterEnemy('golem-lord'),
      enemyQueuedRunes: [createEnemyTurnRunes('golem-lord', 2)[0]!],
      random: () => 0,
    });

    expect(result.player.wall).toEqual(player.wall);
    expect(result.logs).toContainEqual(expect.objectContaining({
      effectId: 'rune.destroy',
      output: expect.objectContaining({ removedRuneId: null, noTarget: true }),
    }));
  });

  it('has AI resolve manual Consumption randomly on its own wall', () => {
    const board = createEnemySpellBoard();
    board[0][0] = {
      ...board[0][0],
      id: 'enemy-fire-target',
      runeTypes: ['Fire'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };
    const consumer: EnemyRune = {
      ...createEnemyRune('enemy-consumer', 0),
      castEffectRefs: [createRuneRemovalEffectRef({
        kind: 'consume',
        trigger: 'onCast',
        selection: 'manual',
        targetOwner: 'self',
        runeType: 'Fire',
        payload: createEffectRef('cast.damage', { amount: 5 }),
      })],
    };

    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: board,
      enemyQueuedRunes: [consumer],
      random: () => 0,
    });

    expect(result.player.health).toBe(15);
    expect(result.enemyBoard[0][0].id).toBe('enemy-consumer');
  });

  it('places an enemy Consume rune on the player wall when targeting the opponent', () => {
    const player = createPlayer('player-1', 'Tester', 20, [], 20);
    player.wall[0][0] = {
      ...player.wall[0][0],
      id: 'player-fire-target',
      runeTypes: ['Fire'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };
    const consumer: EnemyRune = {
      ...createEnemyRune('enemy-cross-wall-consumer', 0),
      castEffectRefs: [createRuneRemovalEffectRef({
        kind: 'consume',
        trigger: 'onCast',
        selection: 'manual',
        targetOwner: 'opponent',
        runeType: 'Fire',
      })],
    };

    const result = resolveEnemyTurn({
      player,
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: createEnemySpellBoard(),
      enemyQueuedRunes: [consumer],
      random: () => 0,
    });

    expect(result.player.wall[0][0].id).toBe('enemy-cross-wall-consumer');
    expect(result.enemyBoard.flat().every((cell) => cell.id === null)).toBe(true);
  });

  it('keeps enemy timed plain and removal effects in listed order', () => {
    const board = createEnemySpellBoard();
    board[0][0] = {
      ...board[0][0],
      id: 'timed-enemy-source',
      runeTypes: ['Wind'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [
        createEffectRef('passive.damageEndTurn', { amount: 2 }),
        createRuneRemovalEffectRef({
          kind: 'destroy',
          trigger: 'endTurn',
          selection: 'manual',
          targetOwner: 'self',
          count: 1,
          runeType: 'Fire',
          payload: createEffectRef('cast.damage', { amount: 5 }),
        }),
        createEffectRef('passive.damageEndTurn', { amount: 3 }),
      ],
    };
    board[0][1] = {
      ...board[0][1],
      id: 'timed-enemy-target',
      runeTypes: ['Fire'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };

    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: board,
      enemyQueuedRunes: [createEnemyRune('zero-damage-card', 0)],
      random: () => 0,
    });

    expect(result.player.health).toBe(10);
    expect(result.enemyBoard[0][1].id).toBeNull();
    expect(result.logs.map((log) => log.effectId)).toEqual([
      'passive.damageEndTurn',
      'rune.destroy',
      'passive.damageEndTurn',
    ]);
  });

  it('resolves enemy timed multi-Destroy up to the available unique targets', () => {
    const board = createEnemySpellBoard();
    board[0][0] = {
      ...board[0][0],
      id: 'timed-multi-source',
      runeTypes: ['Wind'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [createRuneRemovalEffectRef({
        kind: 'destroy',
        trigger: 'endTurn',
        selection: 'manual',
        targetOwner: 'self',
        count: 3,
        runeType: 'Fire',
        payload: createEffectRef('cast.damage', { amount: 5 }),
      })],
    };
    for (const col of [1, 2]) {
      board[0][col] = {
        ...board[0][col],
        id: `timed-target-${col}`,
        runeTypes: ['Fire'],
        rarity: 'common',
        castEffectRefs: [],
        passiveEffectRefs: [],
      };
    }

    const result = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 20, [], 20),
      enemy: createMonsterEnemy('goblin'),
      enemyBoard: board,
      enemyQueuedRunes: [createEnemyRune('zero-damage-card', 0)],
      random: () => 0,
    });

    expect(result.player.health).toBe(15);
    expect(result.enemyBoard[0][1].id).toBeNull();
    expect(result.enemyBoard[0][2].id).toBeNull();
    expect(result.logs).toContainEqual(expect.objectContaining({
      effectId: 'rune.destroy',
      output: expect.objectContaining({ destroyedCount: 2 }),
    }));
  });

  it('alternates Golem Lord turns between shield, rocks, and Avalanche', () => {
    const golem = createMonsterEnemy('golem-lord');
    const shieldTurn = resolveEnemyTurn({
      player: createPlayer('player-1', 'Tester', 100, [], 100),
      enemy: golem,
      turnNumber: 0,
      random: () => 0,
    });
    expect(totalShield(shieldTurn.enemyBoard)).toBe(20);
    expect(shieldTurn.enemyBoard.flat().filter((cell) => cell.name === 'Barricade')).toHaveLength(4);

    const rockTurn = resolveEnemyTurn({
      player: shieldTurn.player,
      enemy: shieldTurn.enemy,
      enemyBoard: shieldTurn.enemyBoard,
      turnNumber: 1,
      random: () => 0,
    });
    expect(rockTurn.player.health).toBe(76);
    expect(rockTurn.healthDamage).toBe(24);
    expect(rockTurn.enemyBoard.flat().filter((cell) => cell.name === 'Hurl')).toHaveLength(3);
  });
});
