/**
 * Combat resolution helpers for hand-driven spell-wall casting.
 */

import type { ArtefactId } from '../types/artefacts';
import type { EffectResolutionLog, Enemy, EnemyRune, MonsterId, Player, Rune, RuneConsumeEffectRef, RuneEffectRef, RuneType, ScoringWall, WallPosition } from '../types/game';
import {
  resolveCastEffects,
  resolveEndTurnEffects,
  resolveIncomingDamageEffects,
  resolvePlayerOutgoingDamage,
  resolveStartTurnEffects,
} from './effectResolver';
import type { DrawTypeRequest } from './effectResolver';
import { createEnemyTurnRunes } from './monsterFactory';
import { DEFAULT_HAND_SIZE } from './soloRunFactory';
import { createEmptySpellWall } from './spellWall';
import { copyEffectRefs } from './runeEffects';
import { runeHasType } from './runeHelpers';
import { chooseRandomRunePosition, getRuneRemovalCandidates, isRuneRemovalEffectRef, placeRuneAtPosition, removeRuneAtPosition, wallHasRuneId } from './runeRemoval';
import { addShieldToWallCell, applyDamageToShieldedWall } from './shield';

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
  enemyBoard?: ScoringWall;
  manualRemovalPosition?: WallPosition;
  sourceWallOwner?: 'self' | 'opponent';
}

export interface ConsumedRuneCastInput {
  player: Player;
  enemy: Enemy | null;
  enemyBoard: ScoringWall;
  rune: Rune;
  removedRune: Rune;
  consumeEffect: RuneConsumeEffectRef;
  sourcePosition: WallPosition;
  targetSide: 'player' | 'enemy';
  activeArtefacts?: ArtefactId[];
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
  enemyBoard: ScoringWall;
  pendingRemoval: ReturnType<typeof resolveCastEffects>['pendingRemoval'];
}

export interface EndTurnEffectsInput {
  player: Player;
  enemy: Enemy | null;
  enemyBoard?: ScoringWall;
  activeArtefacts?: ArtefactId[];
}

export interface EndTurnEffectsResult {
  player: Player;
  enemy: Enemy | null;
  enemyBoard: ScoringWall;
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
  enemy: Enemy | null;
  enemyBoard: ScoringWall;
  healthDamage: number;
  logs: EffectResolutionLog[];
}

interface EnemyTurnEffectsResult {
  player: Player;
  enemy: Enemy;
  healthDamage: number;
  logs: EffectResolutionLog[];
  enemyBoard: ScoringWall;
}

function explosiveDamageForRune(rune: Rune | null, removalKind: 'consume' | 'destroy'): number {
  return rune?.passiveEffectRefs.reduce((total, effectRef) => (
    effectRef.effectId === 'passive.explosive' && typeof effectRef.params?.amount === 'number'
      && (!effectRef.params?.removalKind || effectRef.params.removalKind === removalKind)
      ? total + effectRef.params.amount
      : total
  ), 0) ?? 0;
}

function applyDamageToEnemyWall(enemy: Enemy, enemyBoard: ScoringWall, damage: number): {
  enemy: Enemy;
  enemyBoard: ScoringWall;
} {
  const result = applyDamageToShieldedWall(enemyBoard, damage);
  return {
    enemy: { ...enemy, health: Math.max(0, enemy.health - result.remainingDamage) },
    enemyBoard: result.wall,
  };
}

function resolveEnemyTimedRemovalEffects({
  trigger,
  player,
  enemy,
  enemyBoard,
  activeArtefacts,
  random,
}: {
  trigger: 'startTurn' | 'endTurn';
  player: Player;
  enemy: Enemy;
  enemyBoard: ScoringWall;
  activeArtefacts: ArtefactId[];
  random: () => number;
}): EnemyTurnEffectsResult {
  let nextPlayer = player;
  let nextEnemy = enemy;
  let nextBoard = enemyBoard.map((row) => row.map((cell) => ({ ...cell })));
  let healthDamage = 0;
  const logs: EffectResolutionLog[] = [];
  const plainEffectIds = trigger === 'startTurn'
    ? new Set(['passive.healingStartTurn', 'passive.healingStartTurnSynergy', 'passive.drawingStartTurn'])
    : new Set(['passive.damageEndTurn', 'passive.pulseSynergy', 'passive.shieldEndTurnSynergy']);
  const queued = nextBoard.flatMap((row, rowIndex) => row.flatMap((cell, colIndex) => (
    cell.id ? (cell.passiveEffectRefs ?? []).flatMap((effectRef) => (
      (isRuneRemovalEffectRef(effectRef) ? effectRef.trigger === trigger : plainEffectIds.has(effectRef.effectId))
        ? [{ sourceId: cell.id!, sourcePosition: { row: rowIndex, col: colIndex }, effectRef }]
        : []
    )) : []
  )));

  queued.forEach(({ sourceId, sourcePosition, effectRef }: {
    sourceId: string;
    sourcePosition: WallPosition;
    effectRef: RuneEffectRef;
  }) => {
    if (!wallHasRuneId(nextBoard, sourceId)) return;
    if (!isRuneRemovalEffectRef(effectRef)) {
      const amount = typeof effectRef.params?.amount === 'number' ? effectRef.params.amount : 0;
      const synergyType = typeof effectRef.params?.synergyType === 'string'
        ? effectRef.params.synergyType as RuneType
        : null;
      const synergyCount = synergyType ? countFilledWallRunesByType(nextBoard).get(synergyType) ?? 0 : 0;
      const modifier = (
        effectRef.effectId === 'passive.pulseSynergy'
        || effectRef.effectId === 'passive.shieldEndTurnSynergy'
        || effectRef.effectId === 'passive.healingStartTurnSynergy'
      ) ? amount * synergyCount : amount;
      logs.push({
        sourceType: 'rune', sourceId, effectId: effectRef.effectId, trigger,
        input: {}, output: { modifier, synergyType, synergyCount, sourcePosition }, displayHint: 'damage',
      });
      if (effectRef.effectId === 'passive.damageEndTurn' || effectRef.effectId === 'passive.pulseSynergy') {
        const damageResult = resolveEnemyIncomingDamage({
          player: nextPlayer,
          enemy: nextEnemy,
          baseDamage: modifier,
          activeArtefacts,
          random,
          enemyBoard: nextBoard,
        });
        nextPlayer = damageResult.player;
        nextEnemy = damageResult.enemy ?? nextEnemy;
        nextBoard = damageResult.enemyBoard;
        healthDamage += damageResult.healthDamage;
        logs.push(...damageResult.logs);
      } else if (effectRef.effectId === 'passive.shieldEndTurnSynergy') {
        nextBoard = addShieldToWallCell(nextBoard, sourcePosition, modifier);
      } else if (
        effectRef.effectId === 'passive.healingStartTurn'
        || effectRef.effectId === 'passive.healingStartTurnSynergy'
      ) {
        nextEnemy = { ...nextEnemy, health: Math.min(nextEnemy.maxHealth, nextEnemy.health + Math.max(0, modifier)) };
      }
      return;
    }

    if (effectRef.effectId !== 'rune.destroy') return;
    const targetIsSelf = effectRef.targetOwner === 'self';
    let destroyedCount = 0;
    const destroyedTargets: Array<{ id: string; row: number; col: number; explosiveDamage: number }> = [];
    for (let index = 0; index < effectRef.count; index += 1) {
      const targetWall = targetIsSelf ? nextBoard : nextPlayer.wall;
      const position = chooseRandomRunePosition(getRuneRemovalCandidates({
        wall: targetWall,
        runeType: effectRef.runeType,
        excludedRuneId: targetIsSelf ? sourceId : null,
      }), random);
      if (!position) break;
      const removal = removeRuneAtPosition(targetWall, position);
      if (!removal.removedRune) break;
      destroyedCount += 1;
      const explosiveDamage = explosiveDamageForRune(removal.removedRune, 'destroy');
      if (targetIsSelf) {
        nextBoard = removal.wall;
        const damageResult = resolveEnemyIncomingDamage({
          player: nextPlayer,
          enemy: nextEnemy,
          baseDamage: explosiveDamage,
          activeArtefacts,
          random,
          enemyBoard: nextBoard,
        });
        nextPlayer = damageResult.player;
        nextEnemy = damageResult.enemy ?? nextEnemy;
        nextBoard = damageResult.enemyBoard;
        healthDamage += damageResult.healthDamage;
        logs.push(...damageResult.logs);
      } else {
        nextPlayer = { ...nextPlayer, wall: removal.wall };
        const damageResult = applyDamageToEnemyWall(nextEnemy, nextBoard, explosiveDamage);
        nextEnemy = damageResult.enemy;
        nextBoard = damageResult.enemyBoard;
      }
      destroyedTargets.push({
        id: removal.removedRune.id,
        row: position.row,
        col: position.col,
        explosiveDamage,
      });
    }
    if (destroyedCount === 0) {
      logs.push({
        sourceType: 'rune', sourceId, effectId: effectRef.effectId, trigger,
        input: { runeType: effectRef.runeType ?? null }, output: { noTarget: true }, displayHint: 'damage',
      });
      return;
    }
    const amount = typeof effectRef.payload?.params?.amount === 'number' ? effectRef.payload.params.amount : 0;
    if (effectRef.payload?.effectId === 'cast.damage' || effectRef.payload?.effectId === 'passive.damageEndTurn') {
      const damageResult = resolveEnemyIncomingDamage({
        player: nextPlayer,
        enemy: nextEnemy,
        baseDamage: amount,
        activeArtefacts,
        random,
        enemyBoard: nextBoard,
      });
      nextPlayer = damageResult.player;
      nextEnemy = damageResult.enemy ?? nextEnemy;
      nextBoard = damageResult.enemyBoard;
      healthDamage += damageResult.healthDamage;
      logs.push(...damageResult.logs);
    } else if (effectRef.payload?.effectId === 'cast.healing' || effectRef.payload?.effectId === 'passive.healingStartTurn') {
      nextEnemy = { ...nextEnemy, health: Math.min(nextEnemy.maxHealth, nextEnemy.health + amount) };
    } else if (effectRef.payload?.effectId === 'cast.shield') {
      nextBoard = addShieldToWallCell(nextBoard, sourcePosition, amount);
    }
    const lastTarget = destroyedTargets[destroyedTargets.length - 1];
    logs.push({
      sourceType: 'rune', sourceId, effectId: effectRef.effectId, trigger,
      input: { runeType: effectRef.runeType ?? null },
      output: {
        removedRuneId: lastTarget?.id,
        removedRuneIds: destroyedTargets.map((target) => target.id),
        row: lastTarget?.row,
        col: lastTarget?.col,
        destroyedCount,
        explosiveDamage: destroyedTargets.reduce((total, target) => total + target.explosiveDamage, 0),
      },
      displayHint: 'damage',
    });
  });

  return { player: nextPlayer, enemy: nextEnemy, enemyBoard: nextBoard, healthDamage, logs };
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
    shield: null,
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

export function castRuneOverWallSlot({
  player,
  enemyBoard,
  hand,
  discardPile,
  selectedHandRuneId,
  targetSide,
  row,
  col,
  createCompletedRuneId = createDefaultCompletedRuneId,
}: WallCastInput & { enemyBoard: ScoringWall; targetSide: 'player' | 'enemy' }): WallCastResult & {
  enemyBoard: ScoringWall;
  removedRune: Rune | null;
} {
  const selectedRune = selectedHandRuneId
    ? hand.find((rune) => rune.id === selectedHandRuneId) ?? null
    : null;
  const targetWall = targetSide === 'player' ? player.wall : enemyBoard;
  const removal = removeRuneAtPosition(targetWall, { row, col });
  if (!selectedRune || !removal.removedRune) {
    return {
      status: 'invalid', player, enemyBoard, hand, discardPile, selectedHandRuneId,
      completedRune: null, completedPosition: null, removedRune: null,
    };
  }
  const completedRune = {
    ...cloneRune(selectedRune),
    id: createCompletedRuneId(selectedRune, { row, col }),
  };
  const replacedWall = placeRuneAtPosition(removal.wall, { row, col }, completedRune);
  return {
    status: 'completed',
    player: targetSide === 'player' ? { ...player, wall: replacedWall } : player,
    enemyBoard: targetSide === 'enemy' ? replacedWall : enemyBoard,
    hand: hand.filter((rune) => rune.id !== selectedRune.id),
    discardPile: [...discardPile, selectedRune],
    selectedHandRuneId: null,
    completedRune,
    completedPosition: { row, col },
    removedRune: removal.removedRune,
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
  enemyBoard = createEmptySpellWall(),
  manualRemovalPosition,
  sourceWallOwner = 'self',
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
    opposingWall: enemyBoard,
    manualRemovalPosition,
    sourceWallOwner,
  });

  return {
    ...result,
    player: result.wallChanged ? {
      ...result.player,
      wall: result.wall,
    } : result.player,
    enemyBoard: result.opposingWall,
  };
}

export function resolveConsumedRuneCastEffects({
  player,
  enemy,
  enemyBoard,
  rune,
  removedRune,
  consumeEffect,
  sourcePosition,
  targetSide,
  activeArtefacts = [],
  suppressedRunes = [],
  handSize = 0,
}: ConsumedRuneCastInput): CompletedRuneCastEffectsResult {
  const explosiveDamage = explosiveDamageForRune(removedRune, 'consume');
  let nextPlayer = player;
  let nextEnemy = enemy;
  let nextEnemyBoard = enemyBoard;
  let removalLogs: EffectResolutionLog[] = [];
  let nextSuppressedRunes = suppressedRunes;

  if (targetSide === 'player') {
    nextSuppressedRunes = [...suppressedRunes, removedRune];
    const outgoing = resolvePlayerOutgoingDamage({
      trigger: 'onRuneRemoved', baseDamage: explosiveDamage, wall: player.wall, activeArtefacts,
    });
    removalLogs = [...outgoing.logs];
    if (nextEnemy) {
      const damaged = applyDamageToEnemyWall(nextEnemy, nextEnemyBoard, outgoing.damage);
      nextEnemy = damaged.enemy;
      nextEnemyBoard = damaged.enemyBoard;
    }
  } else if (explosiveDamage > 0) {
    const incoming = resolveEnemyIncomingDamage({
      player: nextPlayer,
      enemy: nextEnemy,
      enemyBoard: nextEnemyBoard,
      baseDamage: explosiveDamage,
      activeArtefacts,
      random: Math.random,
    });
    nextPlayer = incoming.player;
    nextEnemy = incoming.enemy;
    nextEnemyBoard = incoming.enemyBoard;
    removalLogs = [...incoming.logs];
  }

  const consumeLog: EffectResolutionLog = {
    sourceType: 'rune',
    sourceId: rune.id,
    effectId: 'rune.consume',
    trigger: 'onCast',
    input: { runeType: consumeEffect.runeType ?? null, targetOwner: consumeEffect.targetOwner },
    output: {
      removedRuneId: removedRune.id,
      row: sourcePosition.row,
      col: sourcePosition.col,
      explosiveDamage,
    },
    displayHint: 'damage',
  };
  const consumeIndex = rune.castEffectRefs.findIndex((effectRef) => effectRef.effectId === 'rune.consume');
  const continuationRune: Rune = {
    ...rune,
    castEffectRefs: [
      ...rune.castEffectRefs.slice(0, consumeIndex),
      ...(consumeEffect.payload ? [consumeEffect.payload] : []),
      ...rune.castEffectRefs.slice(consumeIndex + 1),
    ],
  };
  const resolved = resolveCompletedRuneCastEffects({
    player: nextPlayer,
    enemy: nextEnemy,
    rune: continuationRune,
    activeArtefacts,
    sourcePosition,
    sourceWallOwner: targetSide === 'player' ? 'self' : 'opponent',
    suppressedRunes: nextSuppressedRunes,
    handSize,
    enemyBoard: nextEnemyBoard,
  });
  return { ...resolved, logs: [consumeLog, ...removalLogs, ...resolved.logs] };
}

function resolveEnemyIncomingDamage({
  player,
  enemy,
  enemyBoard,
  baseDamage,
  activeArtefacts,
  random = Math.random,
}: {
  player: Player;
  enemy: Enemy | null;
  enemyBoard: ScoringWall;
  baseDamage: number;
  activeArtefacts: ArtefactId[];
  random?: () => number;
}): EnemyIncomingDamageResult {
  const normalizedBaseDamage = Math.max(0, baseDamage);
  if (normalizedBaseDamage === 0) {
    return { player, enemy, enemyBoard, healthDamage: 0, logs: [] };
  }

  const damageEffects = resolveIncomingDamageEffects({
    player,
    enemy,
    baseDamage: normalizedBaseDamage,
    activeArtefacts,
    random,
    opposingWall: enemyBoard,
  });
  const incomingDamage = damageEffects.incomingDamage;
  const shieldResult = applyDamageToShieldedWall(damageEffects.player.wall, incomingDamage);
  const healthDamage = shieldResult.remainingDamage;
  let nextEnemy = damageEffects.enemy;
  let nextEnemyBoard = damageEffects.opposingWall;
  const destructionLogs: EffectResolutionLog[] = [];
  shieldResult.removedRunes.forEach((rune) => {
    const outgoing = resolvePlayerOutgoingDamage({
      trigger: 'onRuneRemoved',
      baseDamage: explosiveDamageForRune(rune, 'destroy'),
      wall: shieldResult.wall,
      activeArtefacts,
    });
    destructionLogs.push(...outgoing.logs);
    if (!nextEnemy || outgoing.damage <= 0) return;
    const damageResult = applyDamageToEnemyWall(nextEnemy, nextEnemyBoard, outgoing.damage);
    nextEnemy = damageResult.enemy;
    nextEnemyBoard = damageResult.enemyBoard;
  });

  return {
    player: {
      ...damageEffects.player,
      wall: shieldResult.wall,
      health: Math.max(0, damageEffects.player.health - healthDamage),
    },
    enemy: nextEnemy,
    enemyBoard: nextEnemyBoard,
    healthDamage,
    logs: [...damageEffects.logs, ...destructionLogs],
  };
}

function resolveEnemyStartTurnEffects({
  player,
  enemy,
  enemyBoard,
  activeArtefacts,
  random,
}: {
  player: Player;
  enemy: Enemy;
  enemyBoard: ScoringWall;
  activeArtefacts: ArtefactId[];
  random: () => number;
}): EnemyTurnEffectsResult {
  return resolveEnemyTimedRemovalEffects({
    trigger: 'startTurn', player, enemy, enemyBoard, activeArtefacts, random,
  });
}

function resolveEnemyCardEffects({
  player,
  enemy,
  enemyBoard,
  rune,
  activeArtefacts,
  random,
  sourcePosition,
  sourceOwner = 'self',
}: {
  player: Player;
  enemy: Enemy;
  enemyBoard: ScoringWall;
  rune: EnemyRune;
  activeArtefacts: ArtefactId[];
  random: () => number;
  sourcePosition: WallPosition;
  sourceOwner?: 'self' | 'opponent';
}): EnemyTurnEffectsResult {
  let nextPlayer = player;
  let nextEnemy = enemy;
  let nextBoard = enemyBoard;
  let healthDamage = 0;
  const logs: EffectResolutionLog[] = [];
  const hasCatalogDamage = rune.castEffectRefs.some((effectRef) => effectRef.effectId === 'cast.damage');

  const applyIncomingPacket = (amount: number) => {
    const result = resolveEnemyIncomingDamage({
      player: nextPlayer,
      enemy: nextEnemy,
      baseDamage: amount,
      activeArtefacts,
      random,
      enemyBoard: nextBoard,
    });
    nextPlayer = result.player;
    nextEnemy = result.enemy ?? nextEnemy;
    nextBoard = result.enemyBoard;
    healthDamage += result.healthDamage;
    logs.push(...result.logs);
  };

  if (!hasCatalogDamage && rune.damage > 0) applyIncomingPacket(rune.damage);

  rune.castEffectRefs.forEach((effectRef) => {
    if (!isRuneRemovalEffectRef(effectRef)) {
      const amount = typeof effectRef.params?.amount === 'number' ? effectRef.params.amount : 0;
      if (effectRef.effectId === 'cast.damage') {
        applyIncomingPacket(amount);
      } else if (effectRef.effectId === 'cast.synergy') {
        const synergyType = typeof effectRef.params?.synergyType === 'string'
          ? effectRef.params.synergyType as RuneType
          : null;
        const synergyCount = synergyType
          ? countFilledWallRunesByType(nextBoard).get(synergyType) ?? 0
          : 0;
        applyIncomingPacket(amount * synergyCount);
      } else if (effectRef.effectId === 'cast.shield') {
        if (sourceOwner === 'self') nextBoard = addShieldToWallCell(nextBoard, sourcePosition, amount);
        else nextPlayer = { ...nextPlayer, wall: addShieldToWallCell(nextPlayer.wall, sourcePosition, amount) };
      } else if (effectRef.effectId === 'cast.healing') {
        nextEnemy = { ...nextEnemy, health: Math.min(nextEnemy.maxHealth, nextEnemy.health + Math.max(0, amount)) };
      }
      return;
    }
    if (effectRef.trigger !== 'onCast') return;

    if (effectRef.effectId !== 'rune.destroy') return;
    const targetIsSelf = effectRef.targetOwner === 'self';
    const targetWall = targetIsSelf ? nextBoard : nextPlayer.wall;
    const position = chooseRandomRunePosition(getRuneRemovalCandidates({
      wall: targetWall,
      runeType: effectRef.runeType,
      excludedRuneId: targetIsSelf ? rune.id : null,
    }), random);
    if (!position) {
      logs.push({
        sourceType: 'rune', sourceId: rune.id, effectId: effectRef.effectId, trigger: 'onCast',
        input: { runeType: effectRef.runeType ?? null },
        output: { removedRuneId: null, row: null, col: null, noTarget: true },
        displayHint: 'damage',
      });
      return;
    }

    const removal = removeRuneAtPosition(targetWall, position);
    if (!removal.removedRune) return;
    const explosiveDamage = explosiveDamageForRune(removal.removedRune, 'destroy');
    if (targetIsSelf) {
      nextBoard = removal.wall;
      applyIncomingPacket(explosiveDamage);
    } else {
      nextPlayer = { ...nextPlayer, wall: removal.wall };
      const damageResult = applyDamageToEnemyWall(nextEnemy, nextBoard, explosiveDamage);
      nextEnemy = damageResult.enemy;
      nextBoard = damageResult.enemyBoard;
    }
    logs.push({
      sourceType: 'rune', sourceId: rune.id, effectId: effectRef.effectId, trigger: 'onCast',
      input: { runeType: effectRef.runeType ?? null },
      output: {
        removedRuneId: removal.removedRune.id,
        row: position.row,
        col: position.col,
        explosiveDamage,
      },
      displayHint: 'damage',
    });

    for (let remaining = effectRef.count - 1; remaining > 0; remaining -= 1) {
      const remainingWall = targetIsSelf ? nextBoard : nextPlayer.wall;
      const nextPosition = chooseRandomRunePosition(getRuneRemovalCandidates({
        wall: remainingWall,
        runeType: effectRef.runeType,
        excludedRuneId: targetIsSelf ? rune.id : null,
      }), random);
      if (!nextPosition) break;
      const nextRemoval = removeRuneAtPosition(remainingWall, nextPosition);
      if (!nextRemoval.removedRune) break;
      const nextExplosiveDamage = explosiveDamageForRune(nextRemoval.removedRune, 'destroy');
      if (targetIsSelf) {
        nextBoard = nextRemoval.wall;
        applyIncomingPacket(nextExplosiveDamage);
      } else {
        nextPlayer = { ...nextPlayer, wall: nextRemoval.wall };
        const damageResult = applyDamageToEnemyWall(nextEnemy, nextBoard, nextExplosiveDamage);
        nextEnemy = damageResult.enemy;
        nextBoard = damageResult.enemyBoard;
      }
      logs.push({
        sourceType: 'rune', sourceId: rune.id, effectId: effectRef.effectId, trigger: 'onCast',
        input: { runeType: effectRef.runeType ?? null },
        output: {
          removedRuneId: nextRemoval.removedRune.id,
          row: nextPosition.row,
          col: nextPosition.col,
          explosiveDamage: nextExplosiveDamage,
        },
        displayHint: 'damage',
      });
    }

    const payloadAmount = typeof effectRef.payload?.params?.amount === 'number'
      ? effectRef.payload.params.amount
      : 0;
    if (effectRef.payload?.effectId === 'cast.damage' || effectRef.payload?.effectId === 'passive.damageEndTurn') {
      applyIncomingPacket(payloadAmount);
    } else if (effectRef.payload?.effectId === 'cast.healing' || effectRef.payload?.effectId === 'passive.healingStartTurn') {
      nextEnemy = { ...nextEnemy, health: Math.min(nextEnemy.maxHealth, nextEnemy.health + Math.max(0, payloadAmount)) };
    } else if (effectRef.payload?.effectId === 'cast.shield') {
      if (sourceOwner === 'self') nextBoard = addShieldToWallCell(nextBoard, sourcePosition, payloadAmount);
      else nextPlayer = { ...nextPlayer, wall: addShieldToWallCell(nextPlayer.wall, sourcePosition, payloadAmount) };
    }
  });

  return { player: nextPlayer, enemy: nextEnemy, enemyBoard: nextBoard, healthDamage, logs };
}

function resolveEnemyEndTurnEffects({
  player,
  enemy,
  enemyBoard,
  activeArtefacts,
  random,
}: {
  player: Player;
  enemy: Enemy;
  enemyBoard: ScoringWall;
  activeArtefacts: ArtefactId[];
  random: () => number;
}): EnemyTurnEffectsResult {
  return resolveEnemyTimedRemovalEffects({
    trigger: 'endTurn', player, enemy, enemyBoard, activeArtefacts, random,
  });
}

export function resolveEnemyTurn({
  player,
  enemy,
  enemyBoard = createEmptySpellWall(),
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
  let nextBoard = enemyBoard.map((row) => row.map((cell) => ({ ...cell })));
  let healthDamage = 0;
  const startTurnResult = resolveEnemyStartTurnEffects({
    player: nextPlayer,
    enemy: nextEnemy,
    enemyBoard: nextBoard,
    activeArtefacts,
    random,
  });
  nextPlayer = startTurnResult.player;
  nextEnemy = startTurnResult.enemy;
  nextBoard = startTurnResult.enemyBoard ?? nextBoard;
  let logs = [...startTurnResult.logs];

  for (const rune of runesToPlay) {
    const consumeIndex = rune.castEffectRefs.findIndex((effectRef) => (
      isRuneRemovalEffectRef(effectRef) && effectRef.effectId === 'rune.consume'
    ));
    const consumeEffect = consumeIndex >= 0 ? rune.castEffectRefs[consumeIndex] : null;
    if (consumeEffect && isRuneRemovalEffectRef(consumeEffect) && consumeEffect.effectId === 'rune.consume') {
      const targetSide = consumeEffect.targetOwner === 'self' ? 'enemy' : 'player';
      const targetWall = targetSide === 'enemy' ? nextBoard : nextPlayer.wall;
      const target = chooseRandomRunePosition(getRuneRemovalCandidates({
        wall: targetWall,
        runeType: consumeEffect.runeType,
      }), random);
      if (!target) continue;
      const removal = removeRuneAtPosition(targetWall, target);
      if (!removal.removedRune) continue;
      const replacedWall = placeRuneAtPosition(removal.wall, target, rune);
      if (targetSide === 'enemy') nextBoard = replacedWall;
      else nextPlayer = { ...nextPlayer, wall: replacedWall };

      const explosiveDamage = explosiveDamageForRune(removal.removedRune, 'consume');
      if (targetSide === 'enemy') {
        const incoming = resolveEnemyIncomingDamage({
          player: nextPlayer,
          enemy: nextEnemy,
          enemyBoard: nextBoard,
          baseDamage: explosiveDamage,
          activeArtefacts,
          random,
        });
        nextPlayer = incoming.player;
        nextEnemy = incoming.enemy ?? nextEnemy;
        nextBoard = incoming.enemyBoard;
        healthDamage += incoming.healthDamage;
        logs = [...logs, ...incoming.logs];
      } else {
        const outgoing = resolvePlayerOutgoingDamage({
          trigger: 'onRuneRemoved', baseDamage: explosiveDamage, wall: nextPlayer.wall, activeArtefacts,
        });
        const damaged = applyDamageToEnemyWall(nextEnemy, nextBoard, outgoing.damage);
        nextEnemy = damaged.enemy;
        nextBoard = damaged.enemyBoard;
        logs = [...logs, ...outgoing.logs];
      }
      logs.push({
        sourceType: 'rune', sourceId: rune.id, effectId: 'rune.consume', trigger: 'onCast',
        input: { runeType: consumeEffect.runeType ?? null, targetOwner: consumeEffect.targetOwner },
        output: { removedRuneId: removal.removedRune.id, row: target.row, col: target.col, explosiveDamage },
        displayHint: 'damage',
      });
      const continuationRune: EnemyRune = {
        ...rune,
        castEffectRefs: [
          ...rune.castEffectRefs.slice(0, consumeIndex),
          ...(consumeEffect.payload ? [consumeEffect.payload] : []),
          ...rune.castEffectRefs.slice(consumeIndex + 1),
        ],
      };
      const cardResult = resolveEnemyCardEffects({
        player: nextPlayer,
        enemy: nextEnemy,
        enemyBoard: nextBoard,
        rune: continuationRune,
        activeArtefacts,
        random,
        sourcePosition: target,
        sourceOwner: targetSide === 'enemy' ? 'self' : 'opponent',
      });
      nextPlayer = cardResult.player;
      nextEnemy = cardResult.enemy;
      nextBoard = cardResult.enemyBoard;
      healthDamage += cardResult.healthDamage;
      logs = [...logs, ...cardResult.logs];
      continue;
    }

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
      shield: null,
    };
    const cardResult = resolveEnemyCardEffects({
      player: nextPlayer,
      enemy: nextEnemy,
      enemyBoard: nextBoard,
      rune,
      activeArtefacts,
      random,
      sourcePosition: slot,
    });
    nextPlayer = cardResult.player;
    nextEnemy = cardResult.enemy;
    nextBoard = cardResult.enemyBoard ?? nextBoard;
    healthDamage += cardResult.healthDamage;
    logs = [...logs, ...cardResult.logs];
  }

  const endTurnResult = resolveEnemyEndTurnEffects({
    player: nextPlayer,
    enemy: nextEnemy,
    enemyBoard: nextBoard,
    activeArtefacts,
    random,
  });
  nextPlayer = endTurnResult.player;
  nextEnemy = endTurnResult.enemy;
  nextBoard = endTurnResult.enemyBoard ?? nextBoard;
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
  enemyBoard = createEmptySpellWall(),
  activeArtefacts = [],
}: EndTurnEffectsInput): EndTurnEffectsResult {
  const result = resolveEndTurnEffects({
    player,
    enemy,
    wall: player.wall,
    opposingWall: enemyBoard,
    activeArtefacts,
  });
  return { ...result, enemyBoard: result.opposingWall };
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
