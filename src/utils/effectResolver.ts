/**
 * effectResolver - pure effect ref resolution for casts and passives.
 */

import { ARTEFACTS } from '../types/artefacts';
import type { ArtefactId } from '../types/artefacts';
import type {
  EffectRef,
  EffectResolutionLog,
  EffectSourceType,
  EffectTrigger,
  Enemy,
  Player,
  Rune,
  RuneEffectRef,
  RuneRemovalEffectRef,
  RuneType,
  ScoringWall,
  WallCell,
  WallPosition,
} from '../types/game';
import { EFFECT_CATALOG } from './effectCatalog';
import type { CastEffectId, CatalogEffectId } from './effectCatalog';
import { getPrimaryRuneType } from './runeHelpers';
import { createRuneFromPool } from './runeEffects';
import {
  chooseRandomRunePosition,
  copyRuneEffectRef,
  getRuneRemovalCandidates,
  isRuneRemovalEffectRef,
  removeRuneAtPosition,
  wallHasRuneId,
} from './runeRemoval';

export interface CastEffectResolutionInput {
  player: Player;
  enemy: Enemy | null;
  castRune: Rune;
  wall: ScoringWall;
  activeArtefacts?: ArtefactId[];
  sourcePosition?: WallPosition | null;
  suppressedRunes?: Rune[];
  allowRetrigger?: boolean;
  handSize?: number;
  rng?: () => number;
  opposingWall?: ScoringWall;
  manualRemovalPosition?: WallPosition;
  skipManualRemoval?: boolean;
}

export interface DrawTypeRequest {
  amount: number;
  targetType: RuneType;
}

export interface CastEffectResolutionResult {
  player: Player;
  enemy: Enemy | null;
  wall: ScoringWall;
  opposingWall: ScoringWall;
  suppressedRunes: Rune[];
  returnedRunes: Rune[];
  returnedOverflowRunes: Rune[];
  wallChanged: boolean;
  arcaneDustDelta: number;
  drawCount: number;
  drawTypeRequests: DrawTypeRequest[];
  logs: EffectResolutionLog[];
  pendingRemoval: {
    effectRef: RuneRemovalEffectRef;
    remainingEffectRefs: RuneEffectRef[];
  } | null;
}

export interface EndTurnEffectResolutionInput {
  player: Player;
  enemy: Enemy | null;
  wall: ScoringWall;
  activeArtefacts?: ArtefactId[];
}

export interface EndTurnEffectResolutionResult {
  player: Player;
  enemy: Enemy | null;
  logs: EffectResolutionLog[];
}

export interface StartTurnEffectResolutionInput {
  player: Player;
  wall: ScoringWall;
  activeArtefacts?: ArtefactId[];
}

export interface StartTurnEffectResolutionResult {
  player: Player;
  drawCount: number;
  logs: EffectResolutionLog[];
}

export interface ActivePassiveEffect {
  sourceType: EffectSourceType;
  sourceId: string;
  effectRef: RuneEffectRef;
  sourceOrder: number;
  refOrder: number;
  sourcePosition: WallPosition | null;
}

export interface PassiveCollectionInput {
  wall: ScoringWall;
  activeArtefacts: ArtefactId[];
}

export interface PassiveEffectResolutionInput extends PassiveCollectionInput {
  trigger: EffectTrigger;
  baseValues: Record<string, number>;
  castRuneType?: RuneType;
  sourcePosition?: WallPosition | null;
}

export interface PassiveEffectResolutionResult {
  values: Record<string, number>;
  logs: EffectResolutionLog[];
  activePassives: ActivePassiveEffect[];
}

export interface IncomingDamageResolutionResult {
  player: Player;
  enemy: Enemy | null;
  incomingDamage: number;
  removedRunes: Rune[];
  logs: EffectResolutionLog[];
}

export interface TimedRuneRemovalResolutionResult {
  player: Player;
  enemy: Enemy | null;
  opposingWall: ScoringWall;
  removedRunes: Rune[];
  drawCount: number;
  processedKeys: string[];
  logs: EffectResolutionLog[];
  pendingRemoval: {
    sourceId: string;
    sourcePosition: WallPosition;
    effectRef: RuneRemovalEffectRef;
  } | null;
}

interface DamageResolutionInput extends PassiveCollectionInput {
  trigger: EffectTrigger;
  baseDamage: number;
  castRuneType?: RuneType;
  sourcePosition?: WallPosition | null;
}

interface DamageResolutionResult {
  damage: number;
  logs: EffectResolutionLog[];
}

function numberParam(effectRef: EffectRef, key: string, fallback: number = 0): number {
  const value = effectRef.params?.[key];
  return typeof value === 'number' ? value : fallback;
}

function runeTypeParam(effectRef: EffectRef, key: string): RuneType | null {
  const value = effectRef.params?.[key];
  return typeof value === 'string' ? value as RuneType : null;
}

function isCompletedWallCell(cell: WallCell | null | undefined): cell is WallCell & { id: string } {
  return Boolean(cell?.id && cell.runeTypes.length > 0);
}

function countFilledWallRunesByType(wall: ScoringWall): Map<RuneType, number> {
  return wall.reduce<Map<RuneType, number>>((counts, row) => {
    row.forEach((cell) => {
      if (isCompletedWallCell(cell)) {
        cell.runeTypes.forEach((runeType) => {
          counts.set(runeType, (counts.get(runeType) ?? 0) + 1);
        });
      }
    });
    return counts;
  }, new Map<RuneType, number>());
}

function countWallRunesByTypeIncludingTrigger({
  wall,
  counts,
  sourcePosition,
  castRuneType,
  runeType,
}: {
  wall: ScoringWall;
  counts: Map<RuneType, number>;
  sourcePosition: WallPosition | null | undefined;
  castRuneType?: RuneType;
  runeType: RuneType | null;
}): number {
  if (!runeType) {
    return 0;
  }

  const wallCount = counts.get(runeType) ?? 0;
  const sourceCell = sourcePosition ? wall[sourcePosition.row]?.[sourcePosition.col] : null;
  const sourceAlreadyCounted = isCompletedWallCell(sourceCell) && sourceCell.runeTypes.includes(runeType);

  return wallCount + (!sourceAlreadyCounted && castRuneType === runeType ? 1 : 0);
}

function wallHasRuneType(wall: ScoringWall, runeType: RuneType): boolean {
  return wall.some((row) => row.some((cell) => isCompletedWallCell(cell) && cell.runeTypes.includes(runeType)));
}

function countAdjacentCompletedRunes(wall: ScoringWall, sourcePosition: WallPosition | null | undefined): number {
  if (!sourcePosition) {
    return 0;
  }

  let count = 0;
  for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
    for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
      if (rowDelta === 0 && colDelta === 0) {
        continue;
      }

      const cell = wall[sourcePosition.row + rowDelta]?.[sourcePosition.col + colDelta];
      if (isCompletedWallCell(cell)) {
        count += 1;
      }
    }
  }

  return count;
}

function countAdjacentCompletedRunesIncludingSource(
  wall: ScoringWall,
  sourcePosition: WallPosition | null | undefined,
  castRuneType: RuneType
): number {
  if (!sourcePosition) {
    return 0;
  }

  const sourceCell = wall[sourcePosition.row]?.[sourcePosition.col];
  const sourceCount = isCompletedWallCell(sourceCell) ? 1 : (castRuneType ? 1 : 0);
  return countAdjacentCompletedRunes(wall, sourcePosition) + sourceCount;
}

function getAdjacentCompletedPositions(wall: ScoringWall, sourcePosition: WallPosition | null | undefined): WallPosition[] {
  if (!sourcePosition) {
    return [];
  }

  const positions: WallPosition[] = [];
  for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
    for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
      if (rowDelta === 0 && colDelta === 0) {
        continue;
      }

      const position = { row: sourcePosition.row + rowDelta, col: sourcePosition.col + colDelta };
      const cell = wall[position.row]?.[position.col];
      if (isCompletedWallCell(cell)) {
        positions.push(position);
      }
    }
  }

  return positions;
}

function samePosition(left: WallPosition | null | undefined, right: WallPosition): boolean {
  return left?.row === right.row && left.col === right.col;
}

function isAdjacentPosition(left: WallPosition | null | undefined, right: WallPosition | null | undefined): boolean {
  if (!left || !right || samePosition(left, right)) {
    return false;
  }

  return Math.abs(left.row - right.row) <= 1 && Math.abs(left.col - right.col) <= 1;
}

function getCompletedPositionsByType(
  wall: ScoringWall,
  runeType: RuneType,
  sourcePosition: WallPosition | null | undefined
): WallPosition[] {
  return wall.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) => {
      const position = { row: rowIndex, col: colIndex };
      return isCompletedWallCell(cell) && cell.runeTypes.includes(runeType) && !samePosition(sourcePosition, position) ? [position] : [];
    })
  );
}

function chooseRandomPosition(positions: WallPosition[], rng: () => number): WallPosition | null {
  if (positions.length === 0) {
    return null;
  }

  const index = Math.min(positions.length - 1, Math.max(0, Math.floor(rng() * positions.length)));
  return positions[index] ?? null;
}

function copyEffectRefs(effectRefs: RuneEffectRef[] | null | undefined): RuneEffectRef[] {
  if (!effectRefs) {
    return [];
  }

  return effectRefs.map(copyRuneEffectRef);
}

function createRuntimeRuneId(baseId: string): string {
  const randomId = globalThis.crypto?.randomUUID?.();
  if (randomId) {
    return randomId;
  }

  return `${baseId}-copy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createFreshRuneCopy(rune: Rune): Rune {
  return {
    ...rune,
    id: createRuntimeRuneId(rune.id),
    runeTypes: [...rune.runeTypes],
    castEffectRefs: copyEffectRefs(rune.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(rune.passiveEffectRefs),
  };
}

function cloneWall(wall: ScoringWall): ScoringWall {
  return wall.map((row) => row.map((cell) => ({
    id: cell.id,
    name: cell.name,
    runeTypes: [...cell.runeTypes],
    rarity: cell.rarity,
    cardImageSrc: cell.cardImageSrc,
    tokenImageSrc: cell.tokenImageSrc,
    manaCost: cell.manaCost,
    castEffectRefs: cell.castEffectRefs ? copyEffectRefs(cell.castEffectRefs) : null,
    passiveEffectRefs: cell.passiveEffectRefs ? copyEffectRefs(cell.passiveEffectRefs) : null,
  })));
}

function createEmptyWallCell(): WallCell {
  return {
    id: null,
    name: null,
    runeTypes: [],
    rarity: null,
    cardImageSrc: null,
    tokenImageSrc: null,
    castEffectRefs: null,
    passiveEffectRefs: null,
  };
}

function runeFromCompletedCell(
  wall: ScoringWall,
  position: WallPosition
): Rune | null {
  const cell = wall[position.row]?.[position.col];
  if (!isCompletedWallCell(cell)) {
    return null;
  }

  return {
    id: cell.id,
    name: cell.name ?? `${cell.runeTypes[0]} Rune`,
    runeTypes: [...cell.runeTypes],
    rarity: cell.rarity ?? 'common',
    cardImageSrc: cell.cardImageSrc ?? '',
    tokenImageSrc: cell.tokenImageSrc ?? '',
    castEffectRefs: copyEffectRefs(cell.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(cell.passiveEffectRefs),
  };
}

function clearCompletedCell(
  wall: ScoringWall,
  position: WallPosition
): { wall: ScoringWall; suppressedRune: Rune | null } {
  const suppressedRune = runeFromCompletedCell(wall, position);
  if (!suppressedRune) {
    return { wall, suppressedRune: null };
  }

  const nextWall = cloneWall(wall);
  nextWall[position.row][position.col] = createEmptyWallCell();

  return { wall: nextWall, suppressedRune };
}

function convertCompletedCell(
  wall: ScoringWall,
  position: WallPosition,
  targetType: RuneType
): { wall: ScoringWall; suppressedRune: Rune | null } {
  const suppressedRune = runeFromCompletedCell(wall, position);
  if (!suppressedRune) {
    return { wall, suppressedRune: null };
  }

  const nextWall = cloneWall(wall);
  const convertedRune = createRuneFromPool({
    id: suppressedRune.id,
    runeType: targetType,
    random: () => 0,
  });
  nextWall[position.row][position.col] = {
    id: suppressedRune.id,
    name: convertedRune.name,
    runeTypes: [targetType],
    rarity: 'common',
    cardImageSrc: convertedRune.cardImageSrc,
    tokenImageSrc: convertedRune.tokenImageSrc,
    castEffectRefs: [],
    passiveEffectRefs: [],
  };

  return { wall: nextWall, suppressedRune };
}

function getExplosiveDamage(rune: Rune): number {
  return rune.passiveEffectRefs.reduce((total, effectRef) => {
    if (effectRef.effectId !== 'passive.explosive') {
      return total;
    }

    return total + numberParam(effectRef, 'amount');
  }, 0);
}

function isKnownCastEffectId(effectId: string): effectId is CastEffectId {
  const catalogEntry = EFFECT_CATALOG[effectId as CatalogEffectId];
  return catalogEntry?.kind === 'cast';
}

function createEffectLog(
  sourceType: EffectSourceType,
  sourceId: string,
  effectRef: RuneEffectRef,
  trigger: EffectTrigger,
  input: Record<string, unknown>,
  output: Record<string, unknown>
): EffectResolutionLog {
  const catalogEntry = EFFECT_CATALOG[effectRef.effectId as CatalogEffectId];
  return {
    sourceType,
    sourceId,
    effectId: effectRef.effectId,
    trigger,
    input,
    output,
    displayHint: catalogEntry?.displayHint ?? 'unknown',
  };
}

function createCastLog(
  castRune: Rune,
  effectRef: EffectRef,
  input: Record<string, unknown>,
  output: Record<string, unknown>
): EffectResolutionLog {
  return createEffectLog('rune', castRune.id, effectRef, 'onCast', input, output);
}

function sourceTypeOrder(sourceType: EffectSourceType): number {
  return sourceType === 'rune' ? 0 : 1;
}

function stackingOrder(effectRef: EffectRef): number {
  const catalogEntry = EFFECT_CATALOG[effectRef.effectId as CatalogEffectId];
  return catalogEntry?.passive?.stacking === 'multiplier' ? 1 : 0;
}

function passivePriority(effectRef: EffectRef): number {
  const catalogEntry = EFFECT_CATALOG[effectRef.effectId as CatalogEffectId];
  return catalogEntry?.passive?.priority ?? 0;
}

function sortActivePassiveEffects(passives: ActivePassiveEffect[]): ActivePassiveEffect[] {
  return [...passives].sort((left, right) => (
    sourceTypeOrder(left.sourceType) - sourceTypeOrder(right.sourceType) ||
    passivePriority(left.effectRef) - passivePriority(right.effectRef) ||
    stackingOrder(left.effectRef) - stackingOrder(right.effectRef) ||
    left.sourceOrder - right.sourceOrder ||
    left.refOrder - right.refOrder
  ));
}

export function resolveIncomingDamageEffects({
  player,
  enemy,
  baseDamage,
  activeArtefacts = [],
  random = Math.random,
}: {
  player: Player;
  enemy: Enemy | null;
  baseDamage: number;
  activeArtefacts?: ArtefactId[];
  random?: () => number;
}): IncomingDamageResolutionResult {
  let nextWall = cloneWall(player.wall);
  let nextEnemy = enemy;
  let incomingDamage = Math.max(0, baseDamage);
  const removedRunes: Rune[] = [];
  const logs: EffectResolutionLog[] = [];
  const queuedRemovals = collectActivePassiveEffects({ wall: nextWall, activeArtefacts: [] })
    .filter((passive): passive is ActivePassiveEffect & { effectRef: RuneRemovalEffectRef } => (
      isRuneRemovalEffectRef(passive.effectRef)
      && passive.effectRef.trigger === 'onIncomingDamage'
    ));

  for (const queued of queuedRemovals) {
    if (incomingDamage <= 0 || !queued.sourcePosition || !wallHasRuneId(nextWall, queued.sourceId)) {
      continue;
    }
    const candidates = getRuneRemovalCandidates({
      wall: nextWall,
      runeType: queued.effectRef.runeType,
      excludedRuneId: queued.sourceId,
    });
    const position = chooseRandomRunePosition(candidates, random);
    if (!position) {
      logs.push(createEffectLog(
        'rune',
        queued.sourceId,
        queued.effectRef,
        'onIncomingDamage',
        { incomingDamage, runeType: queued.effectRef.runeType ?? null },
        { noTarget: true },
      ));
      continue;
    }

    const removal = removeRuneAtPosition(nextWall, position);
    if (!removal.removedRune) continue;
    nextWall = removal.wall;
    removedRunes.push(removal.removedRune);
    const explosiveDamage = getExplosiveDamage(removal.removedRune);
    nextEnemy = applyExplosiveDamageToEnemy(nextEnemy, explosiveDamage);
    const reduction = queued.effectRef.payload?.effectId === 'passive.reduceDamage'
      ? numberParam(queued.effectRef.payload, 'amount')
      : 0;
    const previousDamage = incomingDamage;
    incomingDamage = Math.max(0, incomingDamage - reduction);
    logs.push(createEffectLog(
      'rune',
      queued.sourceId,
      queued.effectRef,
      'onIncomingDamage',
      { incomingDamage: previousDamage, runeType: queued.effectRef.runeType ?? null },
      {
        removedRuneId: removal.removedRune.id,
        row: position.row,
        col: position.col,
        reduction,
        incomingDamage,
        explosiveDamage,
      },
    ));
  }

  const passiveResult = resolvePassiveEffects({
    trigger: 'onIncomingDamage',
    wall: nextWall,
    activeArtefacts,
    baseValues: { incomingDamage },
  });

  return {
    player: { ...player, wall: nextWall },
    enemy: nextEnemy,
    incomingDamage: Math.max(0, passiveResult.values.incomingDamage ?? incomingDamage),
    removedRunes,
    logs: [...logs, ...passiveResult.logs],
  };
}

export function resolveTimedRuneRemovalEffects({
  trigger,
  player,
  enemy,
  opposingWall,
  processedKeys = [],
  manualRemovalPosition,
  skipManualRemoval = false,
  random = Math.random,
}: {
  trigger: 'startTurn' | 'endTurn';
  player: Player;
  enemy: Enemy | null;
  opposingWall: ScoringWall;
  processedKeys?: string[];
  manualRemovalPosition?: WallPosition;
  skipManualRemoval?: boolean;
  random?: () => number;
}): TimedRuneRemovalResolutionResult {
  let nextPlayer = { ...player, wall: cloneWall(player.wall) };
  let nextEnemy = enemy;
  let nextOpposingWall = cloneWall(opposingWall);
  let drawCount = 0;
  const removedRunes: Rune[] = [];
  const logs: EffectResolutionLog[] = [];
  const nextProcessedKeys = [...processedKeys];
  const queued = collectActivePassiveEffects({ wall: nextPlayer.wall, activeArtefacts: [] })
    .filter((passive): passive is ActivePassiveEffect & { sourcePosition: WallPosition } => {
      if (passive.sourcePosition === null) return false;
      if (isRuneRemovalEffectRef(passive.effectRef)) return passive.effectRef.trigger === trigger;
      const metadata = EFFECT_CATALOG[passive.effectRef.effectId as CatalogEffectId]?.passive;
      return metadata?.trigger === trigger;
    });
  let pendingManualPosition = manualRemovalPosition;
  let shouldSkipManual = skipManualRemoval;

  for (const item of queued) {
    const key = `${item.sourceId}:${item.refOrder}`;
    if (nextProcessedKeys.includes(key) || !wallHasRuneId(nextPlayer.wall, item.sourceId)) continue;
    if (!isRuneRemovalEffectRef(item.effectRef)) {
      nextProcessedKeys.push(key);
      const amount = numberParam(item.effectRef, 'amount');
      const synergyType = runeTypeParam(item.effectRef, 'synergyType');
      const synergyCount = synergyType
        ? countWallRunesByTypeIncludingTrigger({
          wall: nextPlayer.wall,
          counts: countFilledWallRunesByType(nextPlayer.wall),
          sourcePosition: item.sourcePosition,
          runeType: synergyType,
        })
        : 0;
      const modifier = (
        item.effectRef.effectId === 'passive.pulseSynergy'
        || item.effectRef.effectId === 'passive.armorEndTurnSynergy'
        || item.effectRef.effectId === 'passive.healingStartTurnSynergy'
      ) ? amount * synergyCount : amount;
      if (item.effectRef.effectId === 'passive.damageEndTurn' || item.effectRef.effectId === 'passive.pulseSynergy') {
        nextEnemy = nextEnemy && modifier > 0
          ? { ...nextEnemy, health: Math.max(0, nextEnemy.health - modifier) }
          : nextEnemy;
      } else if (item.effectRef.effectId === 'passive.armorEndTurnSynergy') {
        nextPlayer = { ...nextPlayer, armor: nextPlayer.armor + modifier };
      } else if (
        item.effectRef.effectId === 'passive.healingStartTurn'
        || item.effectRef.effectId === 'passive.healingStartTurnSynergy'
      ) {
        nextPlayer = { ...nextPlayer, health: Math.min(nextPlayer.maxHealth, nextPlayer.health + modifier) };
      } else if (item.effectRef.effectId === 'passive.drawingStartTurn') {
        drawCount += modifier;
      }
      logs.push(createEffectLog('rune', item.sourceId, item.effectRef, trigger, {}, {
        modifier,
        ...(synergyType ? { synergyType, synergyCount } : {}),
      }));
      continue;
    }

    const targetWall = item.effectRef.effectId === 'rune.consume' ? nextPlayer.wall : nextOpposingWall;
    const candidates = getRuneRemovalCandidates({
      wall: targetWall,
      runeType: item.effectRef.runeType,
      excludedRuneId: item.effectRef.effectId === 'rune.consume' ? item.sourceId : null,
    });
    if (
      candidates.length > 0
      && item.effectRef.selection === 'manual'
      && !pendingManualPosition
      && !shouldSkipManual
    ) {
      return {
        player: nextPlayer,
        enemy: nextEnemy,
        opposingWall: nextOpposingWall,
        removedRunes,
        drawCount,
        processedKeys: nextProcessedKeys,
        logs,
        pendingRemoval: {
          sourceId: item.sourceId,
          sourcePosition: item.sourcePosition,
          effectRef: copyRuneEffectRef(item.effectRef) as RuneRemovalEffectRef,
        },
      };
    }

    const manualIsValid = pendingManualPosition
      ? candidates.some((position) => position.row === pendingManualPosition?.row && position.col === pendingManualPosition?.col)
      : false;
    if (pendingManualPosition && !manualIsValid) {
      return {
        player: nextPlayer,
        enemy: nextEnemy,
        opposingWall: nextOpposingWall,
        removedRunes,
        drawCount,
        processedKeys: nextProcessedKeys,
        logs,
        pendingRemoval: {
          sourceId: item.sourceId,
          sourcePosition: item.sourcePosition,
          effectRef: copyRuneEffectRef(item.effectRef) as RuneRemovalEffectRef,
        },
      };
    }
    const position = shouldSkipManual
      ? null
      : pendingManualPosition ?? chooseRandomRunePosition(candidates, random);
    pendingManualPosition = undefined;
    shouldSkipManual = false;
    nextProcessedKeys.push(key);
    if (!position) {
      logs.push(createEffectLog('rune', item.sourceId, item.effectRef, trigger, {}, {
        ...(candidates.length === 0 ? { noTarget: true } : { skipped: true }),
      }));
      continue;
    }

    const removal = removeRuneAtPosition(targetWall, position);
    if (!removal.removedRune) continue;
    const explosiveDamage = getExplosiveDamage(removal.removedRune);
    if (item.effectRef.effectId === 'rune.consume') {
      nextPlayer = { ...nextPlayer, wall: removal.wall };
      nextEnemy = applyExplosiveDamageToEnemy(nextEnemy, explosiveDamage);
      removedRunes.push(removal.removedRune);
    } else {
      nextOpposingWall = removal.wall;
      nextPlayer = applyExplosiveDamageToPlayer(nextPlayer, explosiveDamage);
    }

    const payload = item.effectRef.payload;
    let payloadAmount = 0;
    if (payload) {
      payloadAmount = numberParam(payload, 'amount');
      if (payload.effectId === 'cast.damage' || payload.effectId === 'passive.damageEndTurn') {
        nextEnemy = applyExplosiveDamageToEnemy(nextEnemy, payloadAmount);
      } else if (payload.effectId === 'cast.healing' || payload.effectId === 'passive.healingStartTurn') {
        nextPlayer = { ...nextPlayer, health: Math.min(nextPlayer.maxHealth, nextPlayer.health + payloadAmount) };
      } else if (payload.effectId === 'cast.armor') {
        nextPlayer = { ...nextPlayer, armor: nextPlayer.armor + payloadAmount };
      } else if (payload.effectId === 'cast.draw' || payload.effectId === 'passive.drawingStartTurn') {
        drawCount += payloadAmount;
      }
    }
    logs.push(createEffectLog('rune', item.sourceId, item.effectRef, trigger, {}, {
      removedRuneId: removal.removedRune.id,
      row: position.row,
      col: position.col,
      explosiveDamage,
      payloadEffectId: payload?.effectId ?? null,
      payloadAmount,
    }));
  }

  return {
    player: nextPlayer,
    enemy: nextEnemy,
    opposingWall: nextOpposingWall,
    removedRunes,
    drawCount,
    processedKeys: nextProcessedKeys,
    logs,
    pendingRemoval: null,
  };
}

function isDamageFinalizerPassive(effectId: string): boolean {
  return (
    effectId === 'passive.damageBoost' ||
    effectId === 'passive.adjacentDamageBoost' ||
    effectId === 'passive.damageBoostSynergy'
  );
}

function damageFinalizerOrder(effectId: string): number {
  return effectId === 'passive.damageBoostSynergy' ? 1 : 0;
}

export function collectActivePassiveEffects({
  wall,
  activeArtefacts,
}: PassiveCollectionInput): ActivePassiveEffect[] {
  const wallPassives = wall.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) =>
      (isCompletedWallCell(cell) ? cell.passiveEffectRefs ?? [] : []).map<ActivePassiveEffect>((effectRef, refOrder) => ({
        sourceType: 'rune',
        sourceId: cell.id!,
        effectRef,
        sourceOrder: rowIndex * row.length + colIndex,
        refOrder,
        sourcePosition: { row: rowIndex, col: colIndex },
      }))
    )
  );

  const artefactPassives = activeArtefacts.flatMap((artefactId, sourceOrder) =>
    (ARTEFACTS[artefactId]?.passiveEffectRefs ?? []).map<ActivePassiveEffect>((effectRef, refOrder) => ({
      sourceType: 'artefact',
      sourceId: artefactId,
      effectRef,
      sourceOrder,
      refOrder,
      sourcePosition: null,
    }))
  );

  return [...wallPassives, ...artefactPassives];
}

export function resolvePassiveEffects({
  trigger,
  wall,
  activeArtefacts,
  baseValues,
  castRuneType,
  sourcePosition = null,
}: PassiveEffectResolutionInput): PassiveEffectResolutionResult {
  const values = { ...baseValues };
  const logs: EffectResolutionLog[] = [];
  const activePassives = sortActivePassiveEffects(collectActivePassiveEffects({ wall, activeArtefacts }));

  activePassives.forEach((passive) => {
    if (isRuneRemovalEffectRef(passive.effectRef)) {
      return;
    }

    if (isDamageFinalizerPassive(passive.effectRef.effectId)) {
      return;
    }

    const catalogEntry = EFFECT_CATALOG[passive.effectRef.effectId as CatalogEffectId];
    const passiveMetadata = catalogEntry?.kind === 'passive' ? catalogEntry.passive : undefined;
    const input = {
      params: passive.effectRef.params ?? {},
      values: { ...values },
    };

    if (!passiveMetadata) {
      logs.push(createEffectLog(
        passive.sourceType,
        passive.sourceId,
        passive.effectRef,
        trigger,
        input,
        { noOp: true }
      ));
      return;
    }

    if (passiveMetadata.trigger !== trigger) {
      return;
    }

    if (passive.effectRef.effectId === 'passive.explosive') {
      return;
    }

    if (passive.effectRef.effectId === 'passive.addDamage') {
      const targetRuneType = runeTypeParam(passive.effectRef, 'runeType');
      if (targetRuneType !== castRuneType) {
        return;
      }
    }

    if (passive.effectRef.effectId === 'passive.reduceDamage') {
      const previousValue = values[passiveMetadata.target] ?? 0;
      const modifier = numberParam(
        passive.effectRef,
        passiveMetadata.paramKey,
        passiveMetadata.defaultValue
      );
      const nextValue = Math.max(0, previousValue - modifier);
      values[passiveMetadata.target] = nextValue;

      logs.push(createEffectLog(
        passive.sourceType,
        passive.sourceId,
        passive.effectRef,
        trigger,
        input,
        {
          target: passiveMetadata.target,
          stacking: passiveMetadata.stacking,
          modifier,
          previousValue,
          nextValue,
        }
      ));
      return;
    }

    if (
      passive.effectRef.effectId === 'passive.damageBoostSynergy' ||
      passive.effectRef.effectId === 'passive.pulseSynergy' ||
      passive.effectRef.effectId === 'passive.healingStartTurnSynergy'
    ) {
      const synergyType = runeTypeParam(passive.effectRef, 'synergyType');
      const wallRuneCounts = countFilledWallRunesByType(wall);
      const synergyCount = countWallRunesByTypeIncludingTrigger({
        wall,
        counts: wallRuneCounts,
        sourcePosition,
        castRuneType,
        runeType: synergyType,
      });
      const paramKey = passive.effectRef.effectId === 'passive.damageBoostSynergy' ? 'percent' : 'amount';
      const modifier = numberParam(passive.effectRef, paramKey) * synergyCount;
      const previousValue = values[passiveMetadata.target] ?? 0;
      const nextValue = previousValue + modifier;
      values[passiveMetadata.target] = nextValue;

      logs.push(createEffectLog(
        passive.sourceType,
        passive.sourceId,
        passive.effectRef,
        trigger,
        input,
        {
          target: passiveMetadata.target,
          stacking: passiveMetadata.stacking,
          modifier,
          synergyType,
          synergyCount,
          previousValue,
          nextValue,
        }
      ));
      return;
    }

    const previousValue = values[passiveMetadata.target] ?? 0;
    const modifier = numberParam(
      passive.effectRef,
      passiveMetadata.paramKey,
      passiveMetadata.defaultValue
    );
    const nextValue = passiveMetadata.stacking === 'flat'
      ? previousValue + modifier
      : previousValue * modifier;
    values[passiveMetadata.target] = nextValue;

    logs.push(createEffectLog(
      passive.sourceType,
      passive.sourceId,
      passive.effectRef,
      trigger,
      input,
      {
        target: passiveMetadata.target,
        stacking: passiveMetadata.stacking,
        modifier,
        previousValue,
        nextValue,
      }
    ));
  });

  return {
    values,
    logs,
    activePassives,
  };
}

function resolveDamage({
  trigger,
  baseDamage,
  wall,
  activeArtefacts,
  castRuneType,
  sourcePosition = null,
}: DamageResolutionInput): DamageResolutionResult {
  if (baseDamage <= 0) {
    return { damage: 0, logs: [] };
  }

  let damage = baseDamage;
  let damagePercentBonus = 0;
  const logs: EffectResolutionLog[] = [];
  const activePassives = collectActivePassiveEffects({ wall, activeArtefacts })
    .filter((passive) => isDamageFinalizerPassive(passive.effectRef.effectId))
    .sort((left, right) => (
      damageFinalizerOrder(left.effectRef.effectId) - damageFinalizerOrder(right.effectRef.effectId) ||
      sourceTypeOrder(left.sourceType) - sourceTypeOrder(right.sourceType) ||
      passivePriority(left.effectRef) - passivePriority(right.effectRef) ||
      left.sourceOrder - right.sourceOrder ||
      left.refOrder - right.refOrder
    ));

  activePassives.forEach((passive) => {
    const input = {
      params: passive.effectRef.params ?? {},
      values: {
        damage,
        damagePercentBonus,
      },
      baseDamage,
    };

    if (passive.effectRef.effectId === 'passive.damageBoost') {
      const modifier = numberParam(passive.effectRef, 'amount');
      const previousValue = damage;
      damage += modifier;
      logs.push(createEffectLog(
        passive.sourceType,
        passive.sourceId,
        passive.effectRef,
        trigger,
        input,
        {
          target: 'damage',
          stacking: 'flat',
          modifier,
          previousValue,
          nextValue: damage,
        }
      ));
      return;
    }

    if (passive.effectRef.effectId === 'passive.adjacentDamageBoost') {
      if (!isAdjacentPosition(passive.sourcePosition, sourcePosition)) {
        return;
      }

      const modifier = numberParam(passive.effectRef, 'amount');
      const previousValue = damage;
      damage += modifier;
      logs.push(createEffectLog(
        passive.sourceType,
        passive.sourceId,
        passive.effectRef,
        trigger,
        input,
        {
          target: 'damage',
          stacking: 'flat',
          modifier,
          previousValue,
          nextValue: damage,
        }
      ));
      return;
    }

    if (passive.effectRef.effectId === 'passive.damageBoostSynergy') {
      const synergyType = runeTypeParam(passive.effectRef, 'synergyType');
      const wallRuneCounts = countFilledWallRunesByType(wall);
      const synergyCount = countWallRunesByTypeIncludingTrigger({
        wall,
        counts: wallRuneCounts,
        sourcePosition,
        castRuneType,
        runeType: synergyType,
      });
      const modifier = numberParam(passive.effectRef, 'percent') * synergyCount;
      const previousValue = damagePercentBonus;
      damagePercentBonus += modifier;
      logs.push(createEffectLog(
        passive.sourceType,
        passive.sourceId,
        passive.effectRef,
        trigger,
        input,
        {
          target: 'damagePercentBonus',
          stacking: 'multiplier',
          modifier,
          synergyType,
          synergyCount,
          previousValue,
          nextValue: damagePercentBonus,
        }
      ));
    }
  });

  return {
    damage: damage > 0
      ? Math.ceil(damage * (1 + damagePercentBonus / 100))
      : 0,
    logs,
  };
}

function resolvePlainCastEffects({
  player,
  enemy,
  castRune,
  wall,
  activeArtefacts = [],
  sourcePosition = null,
  suppressedRunes = [],
  allowRetrigger = true,
  handSize = 0,
  rng = Math.random,
  opposingWall = [],
}: CastEffectResolutionInput): CastEffectResolutionResult {
  let nextWall = cloneWall(wall);
  let nextSuppressedRunes = [...suppressedRunes];
  let returnedRunes: Rune[] = [];
  let returnedOverflowRunes: Rune[] = [];
  let wallChanged = false;
  let explosiveDamage = 0;
  let baseDamage = 0;
  let baseHealing = 0;
  let baseArmor = 0;
  let baseArcaneDustDelta = 0;
  let baseDrawCount = 0;
  let drawTypeRequests: DrawTypeRequest[] = [];
  let baseMaxHealthDelta = 0;
  let projectedEnemyHealth = enemy?.health ?? null;
  let projectedPlayerHealth = player.health;
  let projectedPlayerArmor = player.armor;
  let projectedPlayerMaxHealth = player.maxHealth;
  const logs: EffectResolutionLog[] = [];
  let wallRuneCounts = countFilledWallRunesByType(nextWall);

  castRune.castEffectRefs.forEach((effectRef) => {
    const baseInput = {
      params: effectRef.params ?? {},
      enemyHealth: projectedEnemyHealth,
      playerHealth: projectedPlayerHealth,
      playerMaxHealth: projectedPlayerMaxHealth,
      playerArmor: projectedPlayerArmor,
      arcaneDustDelta: baseArcaneDustDelta,
      drawCount: baseDrawCount,
      drawTypeRequests,
    };

    if (!isKnownCastEffectId(effectRef.effectId)) {
      logs.push(createCastLog(castRune, effectRef, baseInput, { noOp: true }));
      return;
    }

    switch (effectRef.effectId) {
      case 'cast.damage': {
        const damage = numberParam(effectRef, 'amount');
        baseDamage += damage;
        if (projectedEnemyHealth !== null) {
          projectedEnemyHealth = Math.max(0, projectedEnemyHealth - damage);
        }
        logs.push(createCastLog(castRune, effectRef, baseInput, { damage, enemyHealth: projectedEnemyHealth }));
        break;
      }
      case 'cast.damageAdjacent': {
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, getPrimaryRuneType(castRune));
        const damage = numberParam(effectRef, 'amount') * adjacentCount;
        baseDamage += damage;
        if (projectedEnemyHealth !== null) {
          projectedEnemyHealth = Math.max(0, projectedEnemyHealth - damage);
        }
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          damage,
          adjacentCount,
          sourcePosition,
          enemyHealth: projectedEnemyHealth,
        }));
        break;
      }
      case 'cast.damageConditional': {
        const conditionType = runeTypeParam(effectRef, 'conditionType');
        const threshold = numberParam(effectRef, 'threshold');
        const conditionCount = conditionType ? wallRuneCounts.get(conditionType) ?? 0 : 0;
        const isMet = conditionCount >= threshold;
        const damage = isMet ? numberParam(effectRef, 'amount') : 0;
        baseDamage += damage;
        if (projectedEnemyHealth !== null) {
          projectedEnemyHealth = Math.max(0, projectedEnemyHealth - damage);
        }
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          damage,
          conditionType,
          conditionCount,
          threshold,
          isMet,
          enemyHealth: projectedEnemyHealth,
        }));
        break;
      }
      case 'cast.damageFragile': {
        const fragileType = runeTypeParam(effectRef, 'fragileType');
        const fragileCount = fragileType ? wallRuneCounts.get(fragileType) ?? 0 : 0;
        const reduction = numberParam(effectRef, 'reduction') * fragileCount;
        const damage = Math.max(0, numberParam(effectRef, 'amount') - reduction);
        baseDamage += damage;
        if (projectedEnemyHealth !== null) {
          projectedEnemyHealth = Math.max(0, projectedEnemyHealth - damage);
        }
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          damage,
          fragileType,
          fragileCount,
          reduction,
          enemyHealth: projectedEnemyHealth,
        }));
        break;
      }
      case 'cast.convertRandom': {
        const sourceType = runeTypeParam(effectRef, 'sourceType');
        const targetType = runeTypeParam(effectRef, 'targetType');
        const targetPosition = sourceType
          ? chooseRandomPosition(getCompletedPositionsByType(nextWall, sourceType, sourcePosition), rng)
          : null;
        const convertedRunes: Rune[] = [];
        if (targetPosition && targetType) {
          const result = convertCompletedCell(nextWall, targetPosition, targetType);
          nextWall = result.wall;
          if (result.suppressedRune) {
            wallChanged = true;
            explosiveDamage += getExplosiveDamage(result.suppressedRune);
            convertedRunes.push(result.suppressedRune);
          }
        }
        nextSuppressedRunes = [...nextSuppressedRunes, ...convertedRunes];
        wallRuneCounts = countFilledWallRunesByType(nextWall);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          sourceType,
          targetType,
          convertedRuneIds: convertedRunes.map((rune) => rune.id),
          noTarget: !targetPosition,
        }));
        break;
      }
      case 'cast.convertAdjacent': {
        const targetType = runeTypeParam(effectRef, 'targetType');
        const adjacentPositions = getAdjacentCompletedPositions(nextWall, sourcePosition);
        const convertedRunes: Rune[] = [];
        if (targetType) {
          adjacentPositions.forEach((position) => {
            const result = convertCompletedCell(nextWall, position, targetType);
            nextWall = result.wall;
            if (result.suppressedRune) {
              wallChanged = true;
              explosiveDamage += getExplosiveDamage(result.suppressedRune);
              convertedRunes.push(result.suppressedRune);
            }
          });
        }
        nextSuppressedRunes = [...nextSuppressedRunes, ...convertedRunes];
        wallRuneCounts = countFilledWallRunesByType(nextWall);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          targetType,
          adjacentCount: adjacentPositions.length,
          convertedRuneIds: convertedRunes.map((rune) => rune.id),
        }));
        break;
      }
      case 'cast.healing': {
        const healing = numberParam(effectRef, 'amount');
        baseHealing += healing;
        projectedPlayerHealth = Math.min(projectedPlayerMaxHealth, projectedPlayerHealth + healing);
        logs.push(createCastLog(castRune, effectRef, baseInput, { healing, playerHealth: projectedPlayerHealth }));
        break;
      }
      case 'cast.healSynergy': {
        const synergyType = runeTypeParam(effectRef, 'synergyType');
        const synergyCount = countWallRunesByTypeIncludingTrigger({
          wall: nextWall,
          counts: wallRuneCounts,
          sourcePosition,
          castRuneType: getPrimaryRuneType(castRune),
          runeType: synergyType,
        });
        const healing = numberParam(effectRef, 'amount') * synergyCount;
        baseHealing += healing;
        projectedPlayerHealth = Math.min(projectedPlayerMaxHealth, projectedPlayerHealth + healing);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          healing,
          synergyType,
          synergyCount,
          playerHealth: projectedPlayerHealth,
        }));
        break;
      }
      case 'cast.armor': {
        const armor = numberParam(effectRef, 'amount');
        baseArmor += armor;
        projectedPlayerArmor += armor;
        logs.push(createCastLog(castRune, effectRef, baseInput, { armor, playerArmor: projectedPlayerArmor }));
        break;
      }
      case 'cast.armorAdjacent': {
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, getPrimaryRuneType(castRune));
        const armor = numberParam(effectRef, 'amount') * adjacentCount;
        baseArmor += armor;
        projectedPlayerArmor += armor;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          armor,
          adjacentCount,
          sourcePosition,
          playerArmor: projectedPlayerArmor,
        }));
        break;
      }
      case 'cast.healthIncrease': {
        const healthIncrease = numberParam(effectRef, 'amount');
        baseMaxHealthDelta += healthIncrease;
        projectedPlayerMaxHealth += healthIncrease;
        projectedPlayerHealth += healthIncrease;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          healthIncrease,
          playerMaxHealth: projectedPlayerMaxHealth,
          playerHealth: projectedPlayerHealth,
        }));
        break;
      }
      case 'cast.healthDecrease': {
        const healthDecrease = numberParam(effectRef, 'amount');
        const previousMaxHealth = projectedPlayerMaxHealth;
        projectedPlayerMaxHealth = Math.max(1, projectedPlayerMaxHealth - healthDecrease);
        projectedPlayerHealth = Math.min(projectedPlayerHealth, projectedPlayerMaxHealth);
        baseMaxHealthDelta += projectedPlayerMaxHealth - previousMaxHealth;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          healthDecrease,
          playerMaxHealth: projectedPlayerMaxHealth,
          playerHealth: projectedPlayerHealth,
        }));
        break;
      }
      case 'cast.draw': {
        const drawCount = numberParam(effectRef, 'amount');
        baseDrawCount += drawCount;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          drawCount,
          totalDrawCount: baseDrawCount,
        }));
        break;
      }
      case 'cast.drawType': {
        const drawCount = numberParam(effectRef, 'amount');
        const targetType = runeTypeParam(effectRef, 'targetType');
        if (targetType && drawCount > 0) {
          drawTypeRequests = [...drawTypeRequests, { amount: drawCount, targetType }];
        }
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          drawCount,
          targetType,
          totalDrawTypeCount: drawTypeRequests.reduce((total, request) => total + request.amount, 0),
        }));
        break;
      }
      case 'cast.drawAdjacent': {
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, getPrimaryRuneType(castRune));
        baseDrawCount += adjacentCount;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          drawCount: adjacentCount,
          adjacentCount,
          sourcePosition,
          totalDrawCount: baseDrawCount,
        }));
        break;
      }
      case 'cast.returnAdjacent': {
        const adjacentPositions = getAdjacentCompletedPositions(nextWall, sourcePosition);
        const returnedRuneIds: string[] = [];
        adjacentPositions.forEach((position) => {
          const result = clearCompletedCell(nextWall, position);
          if (!result.suppressedRune) {
            return;
          }

          const returnedRune = createFreshRuneCopy(result.suppressedRune);
          nextWall = result.wall;
          wallChanged = true;
          explosiveDamage += getExplosiveDamage(result.suppressedRune);
          if (handSize + returnedRunes.length < 10) {
            returnedRunes = [...returnedRunes, returnedRune];
          } else {
            returnedOverflowRunes = [...returnedOverflowRunes, returnedRune];
          }
          returnedRuneIds.push(returnedRune.id);
        });
        wallRuneCounts = countFilledWallRunesByType(nextWall);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          adjacentCount: adjacentPositions.length,
          returnedRuneIds,
        }));
        break;
      }
      case 'cast.arcaneDustAdjacent': {
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, getPrimaryRuneType(castRune));
        const arcaneDust = numberParam(effectRef, 'amount') * adjacentCount;
        baseArcaneDustDelta += arcaneDust;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          arcaneDust,
          adjacentCount,
          sourcePosition,
          arcaneDustDelta: baseArcaneDustDelta,
        }));
        break;
      }
      case 'cast.retriggerAdjacent': {
        if (!allowRetrigger) {
          logs.push(createCastLog(castRune, effectRef, baseInput, { skipped: true }));
          break;
        }

        const adjacentPositions = getAdjacentCompletedPositions(nextWall, sourcePosition);
        const retriggeredEffectIds: string[] = [];
        adjacentPositions.forEach((position) => {
          const retriggerRune = runeFromCompletedCell(nextWall, position);
          if (!retriggerRune) {
            return;
          }

          const filteredRune: Rune = {
            ...retriggerRune,
            castEffectRefs: retriggerRune.castEffectRefs.filter((ref) => (
              ref.effectId !== 'cast.retriggerAdjacent' && ref.effectId !== 'cast.retriggerType'
            )),
          };
          if (filteredRune.castEffectRefs.length === 0) {
            return;
          }

          const retriggerResult = resolveCastEffects({
            player: {
              ...player,
              wall: nextWall,
              health: projectedPlayerHealth,
              maxHealth: projectedPlayerMaxHealth,
              armor: projectedPlayerArmor,
            },
            enemy: projectedEnemyHealth === null || !enemy ? enemy : { ...enemy, health: projectedEnemyHealth },
            castRune: filteredRune,
            wall: nextWall,
            suppressedRunes: nextSuppressedRunes,
            activeArtefacts,
            sourcePosition: position,
            allowRetrigger: false,
            handSize: handSize + returnedRunes.length,
            rng,
          });

          const previousProjectedEnemyHealth = projectedEnemyHealth;
          const previousProjectedPlayerHealth = projectedPlayerHealth;
          const previousProjectedPlayerMaxHealth = projectedPlayerMaxHealth;
          const previousProjectedPlayerArmor = projectedPlayerArmor;

          projectedPlayerHealth = retriggerResult.player.health;
          projectedPlayerMaxHealth = retriggerResult.player.maxHealth;
          projectedPlayerArmor = retriggerResult.player.armor;
          projectedEnemyHealth = retriggerResult.enemy?.health ?? projectedEnemyHealth;
          if (previousProjectedEnemyHealth !== null && retriggerResult.enemy) {
            baseDamage += Math.max(0, previousProjectedEnemyHealth - retriggerResult.enemy.health);
          }
          const maxHealthDelta = retriggerResult.player.maxHealth - previousProjectedPlayerMaxHealth;
          baseMaxHealthDelta += maxHealthDelta;
          baseHealing += Math.max(0, retriggerResult.player.health - previousProjectedPlayerHealth - maxHealthDelta);
          baseArmor += Math.max(0, retriggerResult.player.armor - previousProjectedPlayerArmor);
          baseArcaneDustDelta += retriggerResult.arcaneDustDelta;
          baseDrawCount += retriggerResult.drawCount;
          drawTypeRequests = [...drawTypeRequests, ...retriggerResult.drawTypeRequests];
          nextWall = retriggerResult.wall;
          nextSuppressedRunes = retriggerResult.suppressedRunes;
          returnedRunes = [...returnedRunes, ...retriggerResult.returnedRunes];
          returnedOverflowRunes = [...returnedOverflowRunes, ...retriggerResult.returnedOverflowRunes];
          wallChanged = wallChanged || retriggerResult.wallChanged;
          retriggeredEffectIds.push(...filteredRune.castEffectRefs.map((ref) => ref.effectId));
          logs.push(...retriggerResult.logs);
        });

        wallRuneCounts = countFilledWallRunesByType(nextWall);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          adjacentCount: adjacentPositions.length,
          retriggeredEffectIds,
        }));
        break;
      }
      case 'cast.retriggerType': {
        if (!allowRetrigger) {
          logs.push(createCastLog(castRune, effectRef, baseInput, { skipped: true }));
          break;
        }

        const targetType = runeTypeParam(effectRef, 'targetType');
        const targetPositions = targetType ? getCompletedPositionsByType(nextWall, targetType, sourcePosition) : [];
        const retriggeredEffectIds: string[] = [];
        targetPositions.forEach((position) => {
          const retriggerRune = runeFromCompletedCell(nextWall, position);
          if (!retriggerRune) {
            return;
          }

          const filteredRune: Rune = {
            ...retriggerRune,
            castEffectRefs: retriggerRune.castEffectRefs.filter((ref) => (
              ref.effectId !== 'cast.retriggerAdjacent' && ref.effectId !== 'cast.retriggerType'
            )),
          };
          if (filteredRune.castEffectRefs.length === 0) {
            return;
          }

          const retriggerResult = resolveCastEffects({
            player: {
              ...player,
              wall: nextWall,
              health: projectedPlayerHealth,
              maxHealth: projectedPlayerMaxHealth,
              armor: projectedPlayerArmor,
            },
            enemy: projectedEnemyHealth === null || !enemy ? enemy : { ...enemy, health: projectedEnemyHealth },
            castRune: filteredRune,
            wall: nextWall,
            suppressedRunes: nextSuppressedRunes,
            activeArtefacts,
            sourcePosition: position,
            allowRetrigger: false,
            handSize: handSize + returnedRunes.length,
            rng,
          });

          const previousProjectedEnemyHealth = projectedEnemyHealth;
          const previousProjectedPlayerHealth = projectedPlayerHealth;
          const previousProjectedPlayerMaxHealth = projectedPlayerMaxHealth;
          const previousProjectedPlayerArmor = projectedPlayerArmor;

          projectedPlayerHealth = retriggerResult.player.health;
          projectedPlayerMaxHealth = retriggerResult.player.maxHealth;
          projectedPlayerArmor = retriggerResult.player.armor;
          projectedEnemyHealth = retriggerResult.enemy?.health ?? projectedEnemyHealth;
          if (previousProjectedEnemyHealth !== null && retriggerResult.enemy) {
            baseDamage += Math.max(0, previousProjectedEnemyHealth - retriggerResult.enemy.health);
          }
          const maxHealthDelta = retriggerResult.player.maxHealth - previousProjectedPlayerMaxHealth;
          baseMaxHealthDelta += maxHealthDelta;
          baseHealing += Math.max(0, retriggerResult.player.health - previousProjectedPlayerHealth - maxHealthDelta);
          baseArmor += Math.max(0, retriggerResult.player.armor - previousProjectedPlayerArmor);
          baseArcaneDustDelta += retriggerResult.arcaneDustDelta;
          baseDrawCount += retriggerResult.drawCount;
          drawTypeRequests = [...drawTypeRequests, ...retriggerResult.drawTypeRequests];
          nextWall = retriggerResult.wall;
          nextSuppressedRunes = retriggerResult.suppressedRunes;
          returnedRunes = [...returnedRunes, ...retriggerResult.returnedRunes];
          returnedOverflowRunes = [...returnedOverflowRunes, ...retriggerResult.returnedOverflowRunes];
          wallChanged = wallChanged || retriggerResult.wallChanged;
          retriggeredEffectIds.push(...filteredRune.castEffectRefs.map((ref) => ref.effectId));
          logs.push(...retriggerResult.logs);
        });

        wallRuneCounts = countFilledWallRunesByType(nextWall);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          targetType,
          targetCount: targetPositions.length,
          retriggeredEffectIds,
        }));
        break;
      }
      case 'cast.fortune': {
        const arcaneDust = numberParam(effectRef, 'amount');
        baseArcaneDustDelta += arcaneDust;
        logs.push(createCastLog(castRune, effectRef, baseInput, { arcaneDust, arcaneDustDelta: baseArcaneDustDelta }));
        break;
      }
      case 'cast.synergy': {
        const synergyType = runeTypeParam(effectRef, 'synergyType');
        const synergyCount = countWallRunesByTypeIncludingTrigger({
          wall: nextWall,
          counts: wallRuneCounts,
          sourcePosition,
          castRuneType: getPrimaryRuneType(castRune),
          runeType: synergyType,
        });
        const damage = numberParam(effectRef, 'amount') * synergyCount;
        baseDamage += damage;
        if (projectedEnemyHealth !== null) {
          projectedEnemyHealth = Math.max(0, projectedEnemyHealth - damage);
        }
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          damage,
          synergyType,
          synergyCount,
          enemyHealth: projectedEnemyHealth,
        }));
        break;
      }
      case 'cast.armorSynergy': {
        const synergyType = runeTypeParam(effectRef, 'synergyType');
        const synergyCount = countWallRunesByTypeIncludingTrigger({
          wall: nextWall,
          counts: wallRuneCounts,
          sourcePosition,
          castRuneType: getPrimaryRuneType(castRune),
          runeType: synergyType,
        });
        const armor = numberParam(effectRef, 'amount') * synergyCount;
        baseArmor += armor;
        projectedPlayerArmor += armor;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          armor,
          synergyType,
          synergyCount,
          playerArmor: projectedPlayerArmor,
        }));
        break;
      }
      case 'cast.fragile': {
        const fragileType = runeTypeParam(effectRef, 'fragileType');
        const isBlocked = fragileType ? wallHasRuneType(wall, fragileType) : true;
        const damage = isBlocked ? 0 : numberParam(effectRef, 'amount');
        baseDamage += damage;
        if (projectedEnemyHealth !== null) {
          projectedEnemyHealth = Math.max(0, projectedEnemyHealth - damage);
        }
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          damage,
          fragileType,
          isBlocked,
          enemyHealth: projectedEnemyHealth,
        }));
        break;
      }
    }
  });

  const passiveResult = resolvePassiveEffects({
    trigger: 'onCast',
    wall: nextWall,
    activeArtefacts,
    baseValues: {
      damage: baseDamage,
      healing: baseHealing,
      armor: baseArmor,
      arcaneDustDelta: baseArcaneDustDelta,
    },
    castRuneType: getPrimaryRuneType(castRune),
    sourcePosition,
  });

  const damageResult = resolveDamage({
    trigger: 'onCast',
    baseDamage: passiveResult.values.damage ?? 0,
    wall: nextWall,
    activeArtefacts,
    castRuneType: getPrimaryRuneType(castRune),
    sourcePosition,
  });
  const finalDamage = damageResult.damage;
  const finalHealing = passiveResult.values.healing ?? 0;
  const finalArmor = passiveResult.values.armor ?? 0;
  const arcaneDustDelta = passiveResult.values.arcaneDustDelta ?? baseArcaneDustDelta;
  const baseEnemyHealth = enemy?.health ?? null;
  const totalEnemyDamage = finalDamage + explosiveDamage;
  const enemyArmorAbsorbed = enemy ? Math.min(enemy.armor ?? 0, totalEnemyDamage) : 0;
  const enemyAfterExplosive = enemy && totalEnemyDamage > 0
    ? {
      ...enemy,
      armor: (enemy.armor ?? 0) - enemyArmorAbsorbed,
      health: Math.max(0, enemy.health - (totalEnemyDamage - enemyArmorAbsorbed)),
    }
    : enemy;
  const actualEnemyHpLoss = baseEnemyHealth !== null && enemyAfterExplosive
    ? Math.max(0, baseEnemyHealth - enemyAfterExplosive.health)
    : 0;
  const vampirePercent = passiveResult.values.vampirePercent ?? 0;
  const vampireHealing = Math.floor(actualEnemyHpLoss * vampirePercent / 100);
  const finalMaxHealth = Math.max(1, player.maxHealth + baseMaxHealthDelta);
  const healthAfterMaxHealthDelta = baseMaxHealthDelta >= 0
    ? player.health + baseMaxHealthDelta
    : Math.min(player.health, finalMaxHealth);
  const finalHealth = Math.min(finalMaxHealth, healthAfterMaxHealthDelta + finalHealing + vampireHealing);
  const nextPlayer = finalHealing > 0 || vampireHealing > 0 || finalArmor > 0 || baseMaxHealthDelta !== 0
    ? {
      ...player,
      health: finalHealth,
      maxHealth: finalMaxHealth,
      armor: player.armor + finalArmor,
    }
    : player;
  const explosiveLogs = explosiveDamage > 0
    ? [createEffectLog('rune', castRune.id, { effectId: 'passive.explosive' }, 'onCast', {}, { damage: explosiveDamage })]
    : [];
  const vampireLogs = vampireHealing > 0
    ? [createEffectLog('rune', castRune.id, { effectId: 'passive.vampire' }, 'onCast', { actualEnemyHpLoss, vampirePercent }, { healing: vampireHealing, playerHealth: nextPlayer.health })]
    : [];

  return {
    player: nextPlayer,
    enemy: enemyAfterExplosive,
    wall: nextWall,
    opposingWall,
    suppressedRunes: nextSuppressedRunes,
    returnedRunes,
    returnedOverflowRunes,
    wallChanged,
    arcaneDustDelta,
    drawCount: baseDrawCount,
    drawTypeRequests,
    logs: [...logs, ...passiveResult.logs, ...damageResult.logs, ...explosiveLogs, ...vampireLogs],
    pendingRemoval: null,
  };
}

function combineCastResults(
  before: CastEffectResolutionResult,
  after: CastEffectResolutionResult,
): CastEffectResolutionResult {
  return {
    ...after,
    suppressedRunes: after.suppressedRunes,
    returnedRunes: [...before.returnedRunes, ...after.returnedRunes],
    returnedOverflowRunes: [...before.returnedOverflowRunes, ...after.returnedOverflowRunes],
    wallChanged: before.wallChanged || after.wallChanged,
    arcaneDustDelta: before.arcaneDustDelta + after.arcaneDustDelta,
    drawCount: before.drawCount + after.drawCount,
    drawTypeRequests: [...before.drawTypeRequests, ...after.drawTypeRequests],
    logs: [...before.logs, ...after.logs],
  };
}

function applyExplosiveDamageToEnemy(enemy: Enemy | null, damage: number): Enemy | null {
  if (!enemy || damage <= 0) return enemy;
  const absorbed = Math.min(enemy.armor ?? 0, damage);
  return {
    ...enemy,
    armor: (enemy.armor ?? 0) - absorbed,
    health: Math.max(0, enemy.health - (damage - absorbed)),
  };
}

function applyExplosiveDamageToPlayer(player: Player, damage: number): Player {
  if (damage <= 0) return player;
  const absorbed = Math.min(player.armor, damage);
  return {
    ...player,
    armor: player.armor - absorbed,
    health: Math.max(0, player.health - (damage - absorbed)),
  };
}

export function resolveCastEffects(input: CastEffectResolutionInput): CastEffectResolutionResult {
  const removalIndex = input.castRune.castEffectRefs.findIndex((effectRef) => (
    isRuneRemovalEffectRef(effectRef) && effectRef.trigger === 'onCast'
  ));

  if (removalIndex < 0) {
    return resolvePlainCastEffects(input);
  }

  const prefix = input.castRune.castEffectRefs.slice(0, removalIndex);
  const removalEffect = input.castRune.castEffectRefs[removalIndex];
  if (!removalEffect || !isRuneRemovalEffectRef(removalEffect)) {
    return resolvePlainCastEffects(input);
  }
  const remainingEffectRefs = input.castRune.castEffectRefs.slice(removalIndex + 1).map(copyRuneEffectRef);
  const before = resolvePlainCastEffects({
    ...input,
    castRune: { ...input.castRune, castEffectRefs: prefix },
  });
  const playerWithResolvedWall = { ...before.player, wall: before.wall };
  const targetWall = removalEffect.effectId === 'rune.consume' ? before.wall : before.opposingWall;
  const candidates = getRuneRemovalCandidates({
    wall: targetWall,
    runeType: removalEffect.runeType,
    excludedRuneId: removalEffect.effectId === 'rune.consume' ? input.castRune.id : null,
  });

  if (
    candidates.length > 0
    && removalEffect.selection === 'manual'
    && !input.manualRemovalPosition
    && !input.skipManualRemoval
  ) {
    return {
      ...before,
      player: playerWithResolvedWall,
      pendingRemoval: {
        effectRef: copyRuneEffectRef(removalEffect) as RuneRemovalEffectRef,
        remainingEffectRefs,
      },
    };
  }

  const manualPositionIsValid = input.manualRemovalPosition
    ? candidates.some((position) => (
      position.row === input.manualRemovalPosition?.row
      && position.col === input.manualRemovalPosition?.col
    ))
    : false;
  if (input.manualRemovalPosition && !manualPositionIsValid) {
    return before;
  }
  const selectedPosition = input.skipManualRemoval
    ? null
    : input.manualRemovalPosition ?? chooseRandomRunePosition(candidates, input.rng ?? Math.random);
  if (!selectedPosition) {
    const skipped: CastEffectResolutionResult = {
      ...before,
      player: playerWithResolvedWall,
      logs: [...before.logs, createEffectLog(
        'rune',
        input.castRune.id,
        removalEffect,
        'onCast',
        { runeType: removalEffect.runeType ?? null },
        input.skipManualRemoval ? { skipped: true } : { noTarget: true },
      )],
    };
    if (remainingEffectRefs.length === 0) return skipped;
    const after = resolveCastEffects({
      ...input,
      player: skipped.player,
      enemy: skipped.enemy,
      wall: skipped.wall,
      opposingWall: skipped.opposingWall,
      suppressedRunes: skipped.suppressedRunes,
      castRune: { ...input.castRune, castEffectRefs: remainingEffectRefs },
      manualRemovalPosition: undefined,
      skipManualRemoval: false,
    });
    return combineCastResults(skipped, after);
  }

  const removal = removeRuneAtPosition(targetWall, selectedPosition);
  const explosiveDamage = removal.removedRune ? getExplosiveDamage(removal.removedRune) : 0;
  const nextWall = removalEffect.effectId === 'rune.consume' ? removal.wall : before.wall;
  const nextOpposingWall = removalEffect.effectId === 'rune.destroy' ? removal.wall : before.opposingWall;
  const nextPlayer = removalEffect.effectId === 'rune.destroy'
    ? applyExplosiveDamageToPlayer({ ...playerWithResolvedWall, wall: nextWall }, explosiveDamage)
    : { ...playerWithResolvedWall, wall: nextWall };
  const nextEnemy = removalEffect.effectId === 'rune.consume'
    ? applyExplosiveDamageToEnemy(before.enemy, explosiveDamage)
    : before.enemy;
  const removalLog = createEffectLog(
    'rune',
    input.castRune.id,
    removalEffect,
    'onCast',
    { runeType: removalEffect.runeType ?? null },
    {
      removedRuneId: removal.removedRune?.id ?? null,
      row: selectedPosition.row,
      col: selectedPosition.col,
      explosiveDamage,
    },
  );
  const removed: CastEffectResolutionResult = {
    ...before,
    player: nextPlayer,
    enemy: nextEnemy,
    wall: nextWall,
    opposingWall: nextOpposingWall,
    suppressedRunes: removalEffect.effectId === 'rune.consume' && removal.removedRune
      ? [...before.suppressedRunes, removal.removedRune]
      : before.suppressedRunes,
    wallChanged: true,
    logs: [...before.logs, removalLog],
  };
  const continuationRefs: RuneEffectRef[] = [
    ...(removalEffect.payload ? [removalEffect.payload] : []),
    ...remainingEffectRefs,
  ];
  if (continuationRefs.length === 0) return removed;
  const after = resolveCastEffects({
    ...input,
    player: removed.player,
    enemy: removed.enemy,
    wall: removed.wall,
    opposingWall: removed.opposingWall,
    suppressedRunes: removed.suppressedRunes,
    castRune: { ...input.castRune, castEffectRefs: continuationRefs },
    manualRemovalPosition: undefined,
    skipManualRemoval: false,
  });
  return combineCastResults(removed, after);
}

export function resolveStartTurnEffects({
  player,
  wall,
  activeArtefacts = [],
}: StartTurnEffectResolutionInput): StartTurnEffectResolutionResult {
  const passiveResult = resolvePassiveEffects({
    trigger: 'startTurn',
    wall,
    activeArtefacts,
    baseValues: { healing: 0, drawCount: 0 },
  });
  const healing = passiveResult.values.healing ?? 0;
  const drawCount = passiveResult.values.drawCount ?? 0;
  const nextPlayer = healing > 0
    ? {
      ...player,
      health: Math.min(player.maxHealth, player.health + healing),
    }
    : player;

  return {
    player: nextPlayer,
    drawCount,
    logs: passiveResult.logs,
  };
}

export function resolveEndTurnEffects({
  player,
  enemy,
  wall,
  activeArtefacts = [],
}: EndTurnEffectResolutionInput): EndTurnEffectResolutionResult {
  let nextPlayer = player;
  let nextEnemy = enemy;
  const logs: EffectResolutionLog[] = [];
  const activePassives = sortActivePassiveEffects(collectActivePassiveEffects({ wall, activeArtefacts }));

  activePassives.forEach((passive) => {
    const catalogEntry = EFFECT_CATALOG[passive.effectRef.effectId as CatalogEffectId];
    const passiveMetadata = catalogEntry?.kind === 'passive' ? catalogEntry.passive : undefined;
    if (!passiveMetadata || passiveMetadata.trigger !== 'endTurn') {
      return;
    }

    const sourcePosition = passive.sourcePosition;
    const input = {
      params: passive.effectRef.params ?? {},
      values: { [passiveMetadata.target]: 0 },
    };
    let modifier = numberParam(
      passive.effectRef,
      passiveMetadata.paramKey,
      passiveMetadata.defaultValue
    );
    let synergyType: RuneType | null = null;
    let synergyCount = 0;

    if (
      passive.effectRef.effectId === 'passive.pulseSynergy' ||
      passive.effectRef.effectId === 'passive.armorEndTurnSynergy'
    ) {
      synergyType = runeTypeParam(passive.effectRef, 'synergyType');
      synergyCount = countWallRunesByTypeIncludingTrigger({
        wall,
        counts: countFilledWallRunesByType(wall),
        sourcePosition,
        runeType: synergyType,
      });
      modifier *= synergyCount;
    }

    logs.push(createEffectLog(
      passive.sourceType,
      passive.sourceId,
      passive.effectRef,
      'endTurn',
      input,
      {
        target: passiveMetadata.target,
        stacking: passiveMetadata.stacking,
        modifier,
        ...(synergyType ? { synergyType, synergyCount } : {}),
        previousValue: 0,
        nextValue: modifier,
      }
    ));

    if (passiveMetadata.target === 'armor') {
      nextPlayer = {
        ...nextPlayer,
        armor: nextPlayer.armor + modifier,
      };
      return;
    }

    if (passiveMetadata.target !== 'damage') {
      return;
    }

    const damageResult = resolveDamage({
      trigger: 'endTurn',
      baseDamage: modifier,
      wall,
      activeArtefacts,
      sourcePosition,
    });
    logs.push(...damageResult.logs);

    if (nextEnemy && damageResult.damage > 0) {
      nextEnemy = {
        ...nextEnemy,
        health: Math.max(0, nextEnemy.health - damageResult.damage),
      };
    }
  });

  return {
    player: nextPlayer,
    enemy: nextEnemy,
    logs,
  };
}
