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
  RuneType,
  ScoringWall,
  SpellWallCharge,
  WallCell,
} from '../types/game';
import { EFFECT_CATALOG } from './effectCatalog';
import type { CastEffectId, CatalogEffectId } from './effectCatalog';

export interface WallPosition {
  row: number;
  col: number;
}

export interface CastEffectResolutionInput {
  player: Player;
  enemy: Enemy | null;
  castRune: Rune;
  wall: ScoringWall;
  activeArtefacts?: ArtefactId[];
  sourcePosition?: WallPosition | null;
  wallCharges?: SpellWallCharge[][];
  suppressedRunes?: Rune[];
  allowRetrigger?: boolean;
  handSize?: number;
  rng?: () => number;
}

export interface DrawTypeRequest {
  amount: number;
  targetType: RuneType;
}

export interface CastEffectResolutionResult {
  player: Player;
  enemy: Enemy | null;
  wall: ScoringWall;
  wallCharges: SpellWallCharge[][];
  suppressedRunes: Rune[];
  returnedRunes: Rune[];
  wallChanged: boolean;
  arcaneDustDelta: number;
  drawCount: number;
  drawTypeRequests: DrawTypeRequest[];
  logs: EffectResolutionLog[];
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
  effectRef: EffectRef;
  sourceOrder: number;
  refOrder: number;
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

function numberParam(effectRef: EffectRef, key: string, fallback: number = 0): number {
  const value = effectRef.params?.[key];
  return typeof value === 'number' ? value : fallback;
}

function runeTypeParam(effectRef: EffectRef, key: string): RuneType | null {
  const value = effectRef.params?.[key];
  return typeof value === 'string' ? value as RuneType : null;
}

function countFilledWallRunesByType(wall: ScoringWall): Map<RuneType, number> {
  return wall.reduce<Map<RuneType, number>>((counts, row) => {
    row.forEach((cell) => {
      if (cell.runeType) {
        counts.set(cell.runeType, (counts.get(cell.runeType) ?? 0) + 1);
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
  const sourceAlreadyCounted = sourceCell?.runeType === runeType;

  return wallCount + (!sourceAlreadyCounted && castRuneType === runeType ? 1 : 0);
}

function wallHasRuneType(wall: ScoringWall, runeType: RuneType): boolean {
  return wall.some((row) => row.some((cell) => cell.runeType === runeType));
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
      if (cell?.runeType) {
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
  const sourceCount = sourceCell?.runeType ? 1 : (castRuneType ? 1 : 0);
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
      if (cell?.runeType) {
        positions.push(position);
      }
    }
  }

  return positions;
}

function getAdjacentPositions(sourcePosition: WallPosition, rowCount: number, colCount: number): WallPosition[] {
  const positions: WallPosition[] = [];
  for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
    for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
      if (rowDelta === 0 && colDelta === 0) {
        continue;
      }

      const row = sourcePosition.row + rowDelta;
      const col = sourcePosition.col + colDelta;
      if (row >= 0 && row < rowCount && col >= 0 && col < colCount) {
        positions.push({ row, col });
      }
    }
  }

  return positions;
}

function samePosition(left: WallPosition | null | undefined, right: WallPosition): boolean {
  return left?.row === right.row && left.col === right.col;
}

function getCompletedPositionsByType(
  wall: ScoringWall,
  runeType: RuneType,
  sourcePosition: WallPosition | null | undefined
): WallPosition[] {
  return wall.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) => {
      const position = { row: rowIndex, col: colIndex };
      return cell.runeType === runeType && !samePosition(sourcePosition, position) ? [position] : [];
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

function copyEffectRefs(effectRefs: EffectRef[] | null | undefined): EffectRef[] {
  if (!effectRefs) {
    return [];
  }

  return effectRefs.map((effectRef) => ({
    effectId: effectRef.effectId,
    ...(effectRef.params ? { params: { ...effectRef.params } } : {}),
  }));
}

function cloneWall(wall: ScoringWall): ScoringWall {
  return wall.map((row) => row.map((cell) => ({
    runeType: cell.runeType,
    rarity: cell.rarity,
    castEffectRefs: cell.castEffectRefs ? copyEffectRefs(cell.castEffectRefs) : null,
    passiveEffectRefs: cell.passiveEffectRefs ? copyEffectRefs(cell.passiveEffectRefs) : null,
  })));
}

function cloneWallCharges(wallCharges: SpellWallCharge[][] | undefined): SpellWallCharge[][] {
  if (!wallCharges) {
    return [];
  }

  return wallCharges.map((row) => row.map((charge) => ({
    ...charge,
    spentRunes: [...charge.spentRunes],
  })));
}

function createEmptyWallCell(): WallCell {
  return {
    runeType: null,
    rarity: null,
    castEffectRefs: null,
    passiveEffectRefs: null,
  };
}

function runeFromCompletedCell(
  wall: ScoringWall,
  wallCharges: SpellWallCharge[][],
  position: WallPosition
): Rune | null {
  const cell = wall[position.row]?.[position.col];
  const completedRuneId = wallCharges[position.row]?.[position.col]?.completedRuneId;
  if (!cell?.runeType || !completedRuneId) {
    return null;
  }

  return {
    id: completedRuneId,
    runeType: cell.runeType,
    rarity: cell.rarity ?? 'common',
    castEffectRefs: copyEffectRefs(cell.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(cell.passiveEffectRefs),
  };
}

function clearCompletedCell(
  wall: ScoringWall,
  wallCharges: SpellWallCharge[][],
  position: WallPosition
): { wall: ScoringWall; wallCharges: SpellWallCharge[][]; suppressedRune: Rune | null } {
  const suppressedRune = runeFromCompletedCell(wall, wallCharges, position);
  if (!suppressedRune || !wallCharges[position.row]?.[position.col]) {
    return { wall, wallCharges, suppressedRune: null };
  }

  const nextWall = cloneWall(wall);
  const nextWallCharges = cloneWallCharges(wallCharges);
  nextWall[position.row][position.col] = createEmptyWallCell();
  nextWallCharges[position.row][position.col] = {
    ...nextWallCharges[position.row][position.col],
    currentCount: 0,
    spentRunes: [],
    completedRuneId: null,
  };

  return { wall: nextWall, wallCharges: nextWallCharges, suppressedRune };
}

function convertCompletedCell(
  wall: ScoringWall,
  wallCharges: SpellWallCharge[][],
  position: WallPosition,
  targetType: RuneType
): { wall: ScoringWall; wallCharges: SpellWallCharge[][]; suppressedRune: Rune | null } {
  const suppressedRune = runeFromCompletedCell(wall, wallCharges, position);
  if (!suppressedRune) {
    return { wall, wallCharges, suppressedRune: null };
  }

  const nextWall = cloneWall(wall);
  const nextWallCharges = cloneWallCharges(wallCharges);
  nextWall[position.row][position.col] = {
    runeType: targetType,
    rarity: 'common',
    castEffectRefs: [],
    passiveEffectRefs: [],
  };

  return { wall: nextWall, wallCharges: nextWallCharges, suppressedRune };
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
  effectRef: EffectRef,
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

export function collectActivePassiveEffects({
  wall,
  activeArtefacts,
}: PassiveCollectionInput): ActivePassiveEffect[] {
  const wallPassives = wall.flatMap((row, rowIndex) =>
    row.flatMap((cell, colIndex) =>
      (cell.passiveEffectRefs ?? []).map<ActivePassiveEffect>((effectRef, refOrder) => ({
        sourceType: 'rune',
        sourceId: `wall:${rowIndex}:${colIndex}`,
        effectRef,
        sourceOrder: rowIndex * row.length + colIndex,
        refOrder,
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
      passive.effectRef.effectId === 'passive.pulseSynergy'
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

export function resolveCastEffects({
  player,
  enemy,
  castRune,
  wall,
  activeArtefacts = [],
  sourcePosition = null,
  wallCharges,
  suppressedRunes = [],
  allowRetrigger = true,
  handSize = 0,
  rng = Math.random,
}: CastEffectResolutionInput): CastEffectResolutionResult {
  let nextWall = cloneWall(wall);
  let nextWallCharges = cloneWallCharges(wallCharges);
  let nextSuppressedRunes = [...suppressedRunes];
  let returnedRunes: Rune[] = [];
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
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, castRune.runeType);
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
      case 'cast.damageConsuming': {
        const adjacentPositions = getAdjacentCompletedPositions(nextWall, sourcePosition);
        const damage = numberParam(effectRef, 'amount') * adjacentPositions.length;
        baseDamage += damage;
        if (projectedEnemyHealth !== null) {
          projectedEnemyHealth = Math.max(0, projectedEnemyHealth - damage);
        }

        const destroyedRunes: Rune[] = [];
        adjacentPositions.forEach((position) => {
          const result = clearCompletedCell(nextWall, nextWallCharges, position);
          nextWall = result.wall;
          nextWallCharges = result.wallCharges;
          if (result.suppressedRune) {
            wallChanged = true;
            explosiveDamage += getExplosiveDamage(result.suppressedRune);
            destroyedRunes.push(result.suppressedRune);
          }
        });
        nextSuppressedRunes = [...nextSuppressedRunes, ...destroyedRunes];
        wallRuneCounts = countFilledWallRunesByType(nextWall);

        logs.push(createCastLog(castRune, effectRef, baseInput, {
          damage,
          adjacentCount: adjacentPositions.length,
          destroyedRuneIds: destroyedRunes.map((rune) => rune.id),
          enemyHealth: projectedEnemyHealth,
        }));
        break;
      }
      case 'cast.destroyType': {
        const targetType = runeTypeParam(effectRef, 'targetType');
        const targetPosition = targetType
          ? chooseRandomPosition(getCompletedPositionsByType(nextWall, targetType, sourcePosition), rng)
          : null;
        const destroyedRunes: Rune[] = [];
        if (targetPosition) {
          const result = clearCompletedCell(nextWall, nextWallCharges, targetPosition);
          nextWall = result.wall;
          nextWallCharges = result.wallCharges;
          if (result.suppressedRune) {
            wallChanged = true;
            explosiveDamage += getExplosiveDamage(result.suppressedRune);
            destroyedRunes.push(result.suppressedRune);
          }
        }
        nextSuppressedRunes = [...nextSuppressedRunes, ...destroyedRunes];
        wallRuneCounts = countFilledWallRunesByType(nextWall);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          targetType,
          destroyedRuneIds: destroyedRunes.map((rune) => rune.id),
          noTarget: !targetPosition,
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
          const result = convertCompletedCell(nextWall, nextWallCharges, targetPosition, targetType);
          nextWall = result.wall;
          nextWallCharges = result.wallCharges;
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
            const result = convertCompletedCell(nextWall, nextWallCharges, position, targetType);
            nextWall = result.wall;
            nextWallCharges = result.wallCharges;
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
          castRuneType: castRune.runeType,
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
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, castRune.runeType);
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
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, castRune.runeType);
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
          if (handSize + returnedRunes.length >= 10) {
            return;
          }

          const result = clearCompletedCell(nextWall, nextWallCharges, position);
          if (!result.suppressedRune) {
            return;
          }

          nextWall = result.wall;
          nextWallCharges = result.wallCharges;
          wallChanged = true;
          explosiveDamage += getExplosiveDamage(result.suppressedRune);
          returnedRunes = [...returnedRunes, result.suppressedRune];
          returnedRuneIds.push(result.suppressedRune.id);
        });
        wallRuneCounts = countFilledWallRunesByType(nextWall);
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          adjacentCount: adjacentPositions.length,
          returnedRuneIds,
        }));
        break;
      }
      case 'cast.arcaneDustAdjacent': {
        const adjacentCount = countAdjacentCompletedRunesIncludingSource(wall, sourcePosition, castRune.runeType);
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
      case 'cast.chargeAdjacent': {
        const adjacentPositions = sourcePosition
          ? getAdjacentPositions(sourcePosition, nextWallCharges.length, nextWallCharges[0]?.length ?? 0)
          : [];
        let chargedCount = 0;
        adjacentPositions.forEach((position) => {
          const charge = nextWallCharges[position.row]?.[position.col];
          const cell = nextWall[position.row]?.[position.col];
          if (!charge || cell?.runeType || charge.currentCount >= charge.requiredCount - 1) {
            return;
          }
          nextWallCharges = cloneWallCharges(nextWallCharges);
          nextWallCharges[position.row][position.col] = {
            ...charge,
            currentCount: Math.min(charge.requiredCount - 1, charge.currentCount + 1),
          };
          chargedCount += 1;
        });
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          chargedCount,
          sourcePosition,
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
          const retriggerRune = runeFromCompletedCell(nextWall, nextWallCharges, position);
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
              health: projectedPlayerHealth,
              maxHealth: projectedPlayerMaxHealth,
              armor: projectedPlayerArmor,
            },
            enemy: projectedEnemyHealth === null || !enemy ? enemy : { ...enemy, health: projectedEnemyHealth },
            castRune: filteredRune,
            wall: nextWall,
            wallCharges: nextWallCharges,
            suppressedRunes: nextSuppressedRunes,
            activeArtefacts,
            sourcePosition: position,
            allowRetrigger: false,
            handSize,
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
          nextWallCharges = retriggerResult.wallCharges;
          nextSuppressedRunes = retriggerResult.suppressedRunes;
          returnedRunes = [...returnedRunes, ...retriggerResult.returnedRunes];
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
          const retriggerRune = runeFromCompletedCell(nextWall, nextWallCharges, position);
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
              health: projectedPlayerHealth,
              maxHealth: projectedPlayerMaxHealth,
              armor: projectedPlayerArmor,
            },
            enemy: projectedEnemyHealth === null || !enemy ? enemy : { ...enemy, health: projectedEnemyHealth },
            castRune: filteredRune,
            wall: nextWall,
            wallCharges: nextWallCharges,
            suppressedRunes: nextSuppressedRunes,
            activeArtefacts,
            sourcePosition: position,
            allowRetrigger: false,
            handSize,
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
          nextWallCharges = retriggerResult.wallCharges;
          nextSuppressedRunes = retriggerResult.suppressedRunes;
          returnedRunes = [...returnedRunes, ...retriggerResult.returnedRunes];
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
          castRuneType: castRune.runeType,
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
          castRuneType: castRune.runeType,
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
      damagePercentBonus: 0,
      healing: baseHealing,
      armor: baseArmor,
      arcaneDustDelta: baseArcaneDustDelta,
    },
    castRuneType: castRune.runeType,
    sourcePosition,
  });

  const damageAfterFlatBonuses = passiveResult.values.damage ?? 0;
  const damagePercentBonus = passiveResult.values.damagePercentBonus ?? 0;
  const finalDamage = damageAfterFlatBonuses > 0
    ? Math.ceil(damageAfterFlatBonuses * (1 + damagePercentBonus / 100))
    : 0;
  const finalHealing = passiveResult.values.healing ?? 0;
  const finalArmor = passiveResult.values.armor ?? 0;
  const arcaneDustDelta = passiveResult.values.arcaneDustDelta ?? baseArcaneDustDelta;
  const baseEnemyHealth = enemy?.health ?? null;
  const nextEnemy = enemy && finalDamage > 0
    ? {
      ...enemy,
      health: Math.max(0, enemy.health - finalDamage),
    }
    : enemy;
  const enemyAfterExplosive = nextEnemy && explosiveDamage > 0
    ? {
      ...nextEnemy,
      health: Math.max(0, nextEnemy.health - explosiveDamage),
    }
    : nextEnemy;
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
    wallCharges: nextWallCharges,
    suppressedRunes: nextSuppressedRunes,
    returnedRunes,
    wallChanged,
    arcaneDustDelta,
    drawCount: baseDrawCount,
    drawTypeRequests,
    logs: [...logs, ...passiveResult.logs, ...explosiveLogs, ...vampireLogs],
  };
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
  const passiveResult = resolvePassiveEffects({
    trigger: 'endTurn',
    wall,
    activeArtefacts,
    baseValues: { damage: 0 },
  });
  const damage = passiveResult.values.damage ?? 0;
  const nextEnemy = enemy && damage > 0
    ? {
      ...enemy,
      health: Math.max(0, enemy.health - damage),
    }
    : enemy;

  return {
    player,
    enemy: nextEnemy,
    logs: passiveResult.logs,
  };
}
