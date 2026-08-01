/**
 * Combat resolution helpers for hand-driven spell-wall casting.
 */

import type { ArtefactId } from '../types/artefacts';
import type { EffectResolutionLog, Enemy, EnemyRune, MonsterId, Player, Rune, RuneType, ScoringWall, WallCell } from '../types/game';
import {
  resolveCastEffects,
  resolveEndTurnEffects,
  resolvePassiveEffects,
  resolveStartTurnEffects,
} from './effectResolver';
import type { DrawTypeRequest, WallPosition } from './effectResolver';
import { createEnemySpellBoard, createEnemyTurnRunes, DEFAULT_HAND_SIZE } from './gameInitialization';
import { copyEffectRefs } from './runeEffects';
import { runeHasType } from './runeHelpers';

export const EXTRA_DRAW_HAND_LIMIT = 10;

export type WallCastStatus = 'invalid' | 'completed';

export interface WallCastInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  selectedHandRuneId: string | null;
  row: number;
  col: number;
  createCompletedRuneId?: (rune: Rune, position: WallPosition) => string;
}

export interface WallCastResult {
  status: WallCastStatus;
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  selectedHandRuneId: string | null;
  completedRune: Rune | null;
  completedPosition: WallPosition | null;
}

export interface EndPlayerTurnInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  handSize?: number;
  shuffleRunes?: (runes: Rune[]) => Rune[];
}

export interface EndPlayerTurnResult {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
}

export interface DrawRunesInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  drawCount: number;
  handLimit?: number;
  shuffleRunes?: (runes: Rune[]) => Rune[];
}

export interface DrawRunesOfTypeInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  drawTypeRequests: DrawTypeRequest[];
  handLimit?: number;
}

export interface DrawRunesResult {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
}

export interface CompletedRuneCastEffectsInput {
  player: Player;
  enemy: Enemy | null;
  rune: Rune;
  activeArtefacts?: ArtefactId[];
  sourcePosition?: WallPosition | null;
  suppressedRunes?: Rune[];
  handSize?: number;
}

export interface CompletedRuneCastEffectsResult {
  player: Player;
  enemy: Enemy | null;
  suppressedRunes: Rune[];
  returnedRunes: Rune[];
  returnedOverflowRunes: Rune[];
  wallChanged: boolean;
  arcaneDustDelta: number;
  drawCount: number;
  drawTypeRequests: DrawTypeRequest[];
  logs: EffectResolutionLog[];
}

export interface EndTurnEffectsInput {
  player: Player;
  enemy: Enemy | null;
  activeArtefacts?: ArtefactId[];
}

export interface EndTurnEffectsResult {
  player: Player;
  enemy: Enemy | null;
  logs: EffectResolutionLog[];
}

export interface StartTurnEffectsInput {
  player: Player;
  activeArtefacts?: ArtefactId[];
}

export interface StartTurnEffectsResult {
  player: Player;
  drawCount: number;
  logs: EffectResolutionLog[];
}

export interface EnemyTurnInput {
  player: Player;
  enemy: Enemy | null;
  enemyBoard?: ScoringWall;
  enemyQueuedRunes?: EnemyRune[];
  turnNumber?: number;
  activeArtefacts?: ArtefactId[];
  random?: () => number;
}

export interface EnemyTurnResult {
  player: Player;
  enemy: Enemy | null;
  enemyBoard: ScoringWall;
  enemyQueuedRunes: EnemyRune[];
  boardFull: boolean;
  logs: EffectResolutionLog[];
  healthDamage: number;
}

interface EnemyIncomingDamageResult {
  player: Player;
  healthDamage: number;
  logs: EffectResolutionLog[];
}

interface EnemyTurnEffectsResult {
  player: Player;
  enemy: Enemy;
  healthDamage: number;
  logs: EffectResolutionLog[];
}

export interface VictoryDeckInput {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
  suppressedRunes?: Rune[];
}

export interface VictoryDeckResult {
  player: Player;
  hand: Rune[];
  discardPile: Rune[];
}

function shuffleRunes(runes: Rune[]): Rune[] {
  return [...runes].sort(() => Math.random() - 0.5);
}

function cloneRune(rune: Rune): Rune {
  return {
    ...rune,
    runeTypes: [...rune.runeTypes],
    castEffectRefs: copyEffectRefs(rune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(rune.passiveEffectRefs),
  };
}

function createDefaultCompletedRuneId(rune: Rune, position: WallPosition): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `${rune.id}-wall-${position.row}-${position.col}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function countFilledWallRunesByType(wall: ScoringWall): Map<RuneType, number> {
  return wall.reduce<Map<RuneType, number>>((counts, row) => {
    row.forEach((cell) => {
      if (cell.id) {
        cell.runeTypes.forEach((runeType) => {
          counts.set(runeType, (counts.get(runeType) ?? 0) + 1);
        });
      }
    });
    return counts;
  }, new Map<RuneType, number>());
}

export function wallHasRuneType(wall: ScoringWall, runeType: RuneType): boolean {
  return wall.some((row) => row.some((cell) => cell.id !== null && cell.runeTypes.includes(runeType)));
}

export function drawRunes({
  player,
  hand,
  discardPile,
  drawCount,
  handLimit = EXTRA_DRAW_HAND_LIMIT,
  shuffleRunes: shuffle = shuffleRunes,
}: DrawRunesInput): DrawRunesResult {
  let drawDeck = [...player.deck];
  let nextDiscardPile = [...discardPile];
  let nextHand = [...hand];
  const targetHandSize = Math.min(handLimit, nextHand.length + Math.max(0, drawCount));

  const drawFromDeck = () => {
    const count = Math.min(targetHandSize - nextHand.length, drawDeck.length);
    if (count <= 0) {
      return;
    }

    nextHand = [...nextHand, ...drawDeck.slice(0, count)];
    drawDeck = drawDeck.slice(count);
  };

  drawFromDeck();

  if (nextHand.length < targetHandSize && nextDiscardPile.length > 0) {
    drawDeck = shuffle(nextDiscardPile);
    nextDiscardPile = [];
    drawFromDeck();
  }

  return {
    player: {
      ...player,
      deck: drawDeck,
    },
    hand: nextHand,
    discardPile: nextDiscardPile,
  };
}

export function drawRunesOfType({
  player,
  hand,
  discardPile,
  drawTypeRequests,
  handLimit = EXTRA_DRAW_HAND_LIMIT,
}: DrawRunesOfTypeInput): DrawRunesResult {
  let drawDeck = [...player.deck];
  let nextHand = [...hand];

  drawTypeRequests.forEach(({ amount, targetType }) => {
    let remaining = Math.max(0, amount);
    if (remaining <= 0 || nextHand.length >= handLimit) {
      return;
    }

    const nextDrawDeck: Rune[] = [];
    const drawnRunes: Rune[] = [];

    drawDeck.forEach((rune) => {
      if (runeHasType(rune, targetType) && remaining > 0 && nextHand.length + drawnRunes.length < handLimit) {
        drawnRunes.push(rune);
        remaining -= 1;
        return;
      }

      nextDrawDeck.push(rune);
    });

    nextHand = [...nextHand, ...drawnRunes];
    drawDeck = nextDrawDeck;
  });

  return {
    player: {
      ...player,
      deck: drawDeck,
    },
    hand: nextHand,
    discardPile,
  };
}

export function castRuneToWallSlot({
  player,
  hand,
  discardPile,
  selectedHandRuneId,
  row,
  col,
  createCompletedRuneId = createDefaultCompletedRuneId,
}: WallCastInput): WallCastResult {
  const selectedRune = selectedHandRuneId
    ? hand.find((rune) => rune.id === selectedHandRuneId) ?? null
    : null;
  const targetCell = player.wall[row]?.[col] ?? null;

  if (
    !selectedRune ||
    !targetCell ||
    targetCell.id !== null
  ) {
    return {
      status: 'invalid',
      player,
      hand,
      discardPile,
      selectedHandRuneId,
      completedRune: null,
      completedPosition: null,
    };
  }

  const nextHand = hand.filter((rune) => rune.id !== selectedRune.id);
  const completedRuneId = createCompletedRuneId(selectedRune, { row, col });
  const completedRune = { ...cloneRune(selectedRune), id: completedRuneId };
  const nextWall = player.wall.map((wallRow) => [...wallRow]);
  nextWall[row][col] = {
    id: completedRune.id,
    name: completedRune.name,
    runeTypes: [...completedRune.runeTypes],
    rarity: completedRune.rarity,
    cardImageSrc: completedRune.cardImageSrc,
    tokenImageSrc: completedRune.tokenImageSrc,
    manaCost: completedRune.manaCost ?? 2,
    castEffectRefs: copyEffectRefs(completedRune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(completedRune.passiveEffectRefs),
  };

  return {
    status: 'completed',
    player: {
      ...player,
      wall: nextWall,
    },
    hand: nextHand,
    discardPile: [...discardPile, selectedRune],
    selectedHandRuneId: null,
    completedRune,
    completedPosition: { row, col },
  };
}

export function resolveCompletedRuneCastEffects({
  player,
  enemy,
  rune,
  activeArtefacts = [],
  sourcePosition = null,
  suppressedRunes = [],
  handSize = 0,
}: CompletedRuneCastEffectsInput): CompletedRuneCastEffectsResult {
  const result = resolveCastEffects({
    player,
    enemy,
    castRune: rune,
    wall: player.wall,
    activeArtefacts,
    sourcePosition,
    suppressedRunes,
    handSize,
  });

  return {
    ...result,
    player: result.wallChanged ? {
      ...result.player,
      wall: result.wall,
    } : result.player,
  };
}

function resolveEnemyIncomingDamage({
  player,
  baseDamage,
  activeArtefacts,
}: {
  player: Player;
  baseDamage: number;
  activeArtefacts: ArtefactId[];
}): EnemyIncomingDamageResult {
  const normalizedBaseDamage = Math.max(0, baseDamage);
  if (normalizedBaseDamage === 0) {
    return { player, healthDamage: 0, logs: [] };
  }

  const passiveResult = resolvePassiveEffects({
    trigger: 'onEnemyAttack',
    wall: player.wall,
    activeArtefacts,
    baseValues: { incomingDamage: normalizedBaseDamage },
  });
  const incomingDamage = Math.max(0, passiveResult.values.incomingDamage ?? 0);
  const armorAbsorbed = Math.min(player.armor, incomingDamage);
  const healthDamage = incomingDamage - armorAbsorbed;

  return {
    player: {
      ...player,
      armor: player.armor - armorAbsorbed,
      health: Math.max(0, player.health - healthDamage),
    },
    healthDamage,
    logs: passiveResult.logs,
  };
}

function resolveEnemyStartTurnEffects({
  player,
  enemy,
  enemyBoard,
}: {
  player: Player;
  enemy: Enemy;
  enemyBoard: ScoringWall;
}): EnemyTurnEffectsResult {
  const passiveResult = resolvePassiveEffects({
    trigger: 'startTurn',
    wall: enemyBoard,
    activeArtefacts: [],
    baseValues: { healing: 0 },
  });
  const healing = Math.max(0, passiveResult.values.healing ?? 0);

  return {
    player,
    enemy: healing > 0
      ? { ...enemy, health: Math.min(enemy.maxHealth, enemy.health + healing) }
      : enemy,
    healthDamage: 0,
    logs: passiveResult.logs,
  };
}

function resolveEnemyCardEffects({
  player,
  enemy,
  rune,
  activeArtefacts,
}: {
  player: Player;
  enemy: Enemy;
  rune: EnemyRune;
  activeArtefacts: ArtefactId[];
}): EnemyTurnEffectsResult {
  const armorGain = rune.castEffectRefs.reduce((total, effectRef) => (
    effectRef.effectId === 'cast.armor' && typeof effectRef.params?.amount === 'number'
      ? total + Math.max(0, effectRef.params.amount)
      : total
  ), 0);
  const incomingDamageResult = resolveEnemyIncomingDamage({
    player,
    baseDamage: rune.damage,
    activeArtefacts,
  });
  const destroysMostFilledRow = rune.castEffectRefs.some((effectRef) => (
    effectRef.effectId === 'enemy.destroyMostFilledRow'
  ));
  const rowCounts = player.wall.map((row) => row.filter((cell) => cell.id !== null).length);
  const fullestCount = Math.max(0, ...rowCounts);
  const destroyedRowIndex = destroysMostFilledRow && fullestCount > 0
    ? rowCounts.findIndex((count) => count === fullestCount)
    : -1;
  const emptyWallCell = (cell: WallCell): WallCell => ({
    ...cell,
    id: null,
    name: null,
    runeTypes: [],
    rarity: null,
    cardImageSrc: null,
    tokenImageSrc: null,
    manaCost: null,
    castEffectRefs: null,
    passiveEffectRefs: null,
  });
  const playerAfterEnemyEffect = destroyedRowIndex >= 0
    ? {
      ...incomingDamageResult.player,
      wall: incomingDamageResult.player.wall.map((row, rowIndex) => (
        rowIndex === destroyedRowIndex ? row.map(emptyWallCell) : row
      )),
    }
    : incomingDamageResult.player;
  const enemyEffectLogs: EffectResolutionLog[] = destroysMostFilledRow
    ? [{
      sourceType: 'rune',
      sourceId: rune.id,
      effectId: 'enemy.destroyMostFilledRow',
      trigger: 'onCast',
      input: { rowCounts },
      output: {
        destroyedRowIndex: destroyedRowIndex >= 0 ? destroyedRowIndex : null,
        destroyedRuneCount: destroyedRowIndex >= 0 ? fullestCount : 0,
      },
      displayHint: 'damage',
    }]
    : [];

  return {
    player: playerAfterEnemyEffect,
    enemy: armorGain > 0 ? { ...enemy, armor: (enemy.armor ?? 0) + armorGain } : enemy,
    healthDamage: incomingDamageResult.healthDamage,
    logs: [...incomingDamageResult.logs, ...enemyEffectLogs],
  };
}

function resolveEnemyEndTurnEffects({
  player,
  enemy,
  enemyBoard,
  activeArtefacts,
}: {
  player: Player;
  enemy: Enemy;
  enemyBoard: ScoringWall;
  activeArtefacts: ArtefactId[];
}): EnemyTurnEffectsResult {
  const passiveResult = resolvePassiveEffects({
    trigger: 'endTurn',
    wall: enemyBoard,
    activeArtefacts: [],
    baseValues: { armor: 0, damage: 0 },
  });
  const armorGain = Math.max(0, passiveResult.values.armor ?? 0);
  const incomingDamageResult = resolveEnemyIncomingDamage({
    player,
    baseDamage: passiveResult.values.damage ?? 0,
    activeArtefacts,
  });

  return {
    player: incomingDamageResult.player,
    enemy: armorGain > 0 ? { ...enemy, armor: (enemy.armor ?? 0) + armorGain } : enemy,
    healthDamage: incomingDamageResult.healthDamage,
    logs: [...passiveResult.logs, ...incomingDamageResult.logs],
  };
}

export function resolveEnemyTurn({
  player,
  enemy,
  enemyBoard = createEnemySpellBoard(),
  enemyQueuedRunes = [],
  turnNumber = 0,
  activeArtefacts = [],
  random = Math.random,
}: EnemyTurnInput): EnemyTurnResult {
  if (!enemy) {
    return { player, enemy, enemyBoard, enemyQueuedRunes: [], boardFull: false, logs: [], healthDamage: 0 };
  }

  const runesToPlay = enemyQueuedRunes.length > 0
    ? [...enemyQueuedRunes]
    : createEnemyTurnRunes(enemy.id as MonsterId, turnNumber);
  let nextPlayer = player;
  let nextEnemy = enemy;
  const nextBoard = enemyBoard.map((row) => row.map((cell) => ({ ...cell })));
  let healthDamage = 0;
  const startTurnResult = resolveEnemyStartTurnEffects({
    player: nextPlayer,
    enemy: nextEnemy,
    enemyBoard: nextBoard,
  });
  nextPlayer = startTurnResult.player;
  nextEnemy = startTurnResult.enemy;
  let logs = [...startTurnResult.logs];

  for (const rune of runesToPlay) {
    const openSlots: Array<{ row: number; col: number }> = [];
    nextBoard.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
      if (!cell.id) openSlots.push({ row: rowIndex, col: colIndex });
    }));

    if (openSlots.length === 0) break;
    const slot = openSlots[Math.min(openSlots.length - 1, Math.floor(random() * openSlots.length))];
    if (!slot) break;

    nextBoard[slot.row][slot.col] = {
      id: rune.id,
      name: rune.name,
      runeTypes: [...rune.runeTypes],
      rarity: rune.rarity,
      cardImageSrc: rune.cardImageSrc,
      tokenImageSrc: rune.tokenImageSrc,
      manaCost: rune.manaCost ?? 2,
      castEffectRefs: rune.castEffectRefs,
      passiveEffectRefs: rune.passiveEffectRefs,
    };
    const cardResult = resolveEnemyCardEffects({
      player: nextPlayer,
      enemy: nextEnemy,
      rune,
      activeArtefacts,
    });
    nextPlayer = cardResult.player;
    nextEnemy = cardResult.enemy;
    healthDamage += cardResult.healthDamage;
    logs = [...logs, ...cardResult.logs];
  }

  const endTurnResult = resolveEnemyEndTurnEffects({
    player: nextPlayer,
    enemy: nextEnemy,
    enemyBoard: nextBoard,
    activeArtefacts,
  });
  nextPlayer = endTurnResult.player;
  nextEnemy = endTurnResult.enemy;
  healthDamage += endTurnResult.healthDamage;
  logs = [...logs, ...endTurnResult.logs];

  return {
    player: nextPlayer,
    enemy: nextEnemy,
    enemyBoard: nextBoard,
    enemyQueuedRunes: [],
    boardFull: nextBoard.every((row) => row.every((cell) => cell.id !== null)),
    logs,
    healthDamage,
  };
}

export function endPlayerTurn({
  player,
  hand,
  discardPile,
  handSize = DEFAULT_HAND_SIZE,
  shuffleRunes: shuffle = shuffleRunes,
}: EndPlayerTurnInput): EndPlayerTurnResult {
  return drawRunes({
    player,
    hand: [],
    discardPile: [...discardPile, ...hand],
    drawCount: handSize,
    handLimit: handSize,
    shuffleRunes: shuffle,
  });
}

export function resolveCompletedEndTurnEffects({
  player,
  enemy,
  activeArtefacts = [],
}: EndTurnEffectsInput): EndTurnEffectsResult {
  return resolveEndTurnEffects({
    player,
    enemy,
    wall: player.wall,
    activeArtefacts,
  });
}

export function resolveCompletedStartTurnEffects({
  player,
  activeArtefacts = [],
}: StartTurnEffectsInput): StartTurnEffectsResult {
  return resolveStartTurnEffects({
    player,
    wall: player.wall,
    activeArtefacts,
  });
}

export function collectVictoryDeck({ player }: VictoryDeckInput): VictoryDeckResult {
  return {
    player,
    hand: [],
    discardPile: [],
  };
}
