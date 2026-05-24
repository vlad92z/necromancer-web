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
}

export interface CastEffectResolutionResult {
  player: Player;
  enemy: Enemy | null;
  arcaneDustDelta: number;
  drawCount: number;
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

    if (
      passive.effectRef.effectId === 'passive.damageBoostSynergy' ||
      passive.effectRef.effectId === 'passive.pulseSynergy'
    ) {
      const synergyType = runeTypeParam(passive.effectRef, 'synergyType');
      const wallRuneCounts = countFilledWallRunesByType(wall);
      const synergyCount = synergyType ? wallRuneCounts.get(synergyType) ?? 0 : 0;
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
}: CastEffectResolutionInput): CastEffectResolutionResult {
  let baseDamage = 0;
  let baseHealing = 0;
  let baseArmor = 0;
  let baseArcaneDustDelta = 0;
  let baseDrawCount = 0;
  let baseMaxHealthIncrease = 0;
  let projectedEnemyHealth = enemy?.health ?? null;
  let projectedPlayerHealth = player.health;
  let projectedPlayerArmor = player.armor;
  let projectedPlayerMaxHealth = player.maxHealth;
  const logs: EffectResolutionLog[] = [];
  const wallRuneCounts = countFilledWallRunesByType(wall);

  castRune.castEffectRefs.forEach((effectRef) => {
    const baseInput = {
      params: effectRef.params ?? {},
      enemyHealth: projectedEnemyHealth,
      playerHealth: projectedPlayerHealth,
      playerMaxHealth: projectedPlayerMaxHealth,
      playerArmor: projectedPlayerArmor,
      arcaneDustDelta: baseArcaneDustDelta,
      drawCount: baseDrawCount,
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
        const adjacentCount = countAdjacentCompletedRunes(wall, sourcePosition);
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
      case 'cast.healing': {
        const healing = numberParam(effectRef, 'amount');
        baseHealing += healing;
        projectedPlayerHealth = Math.min(projectedPlayerMaxHealth, projectedPlayerHealth + healing);
        logs.push(createCastLog(castRune, effectRef, baseInput, { healing, playerHealth: projectedPlayerHealth }));
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
        const adjacentCount = countAdjacentCompletedRunes(wall, sourcePosition);
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
        baseMaxHealthIncrease += healthIncrease;
        projectedPlayerMaxHealth += healthIncrease;
        projectedPlayerHealth += healthIncrease;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          healthIncrease,
          playerMaxHealth: projectedPlayerMaxHealth,
          playerHealth: projectedPlayerHealth,
        }));
        break;
      }
      case 'cast.drawAdjacent': {
        const adjacentCount = countAdjacentCompletedRunes(wall, sourcePosition);
        baseDrawCount += adjacentCount;
        logs.push(createCastLog(castRune, effectRef, baseInput, {
          drawCount: adjacentCount,
          adjacentCount,
          sourcePosition,
          totalDrawCount: baseDrawCount,
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
        const synergyCount = synergyType ? wallRuneCounts.get(synergyType) ?? 0 : 0;
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
        const synergyCount = synergyType ? wallRuneCounts.get(synergyType) ?? 0 : 0;
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
    wall,
    activeArtefacts,
    baseValues: {
      damage: baseDamage,
      damagePercentBonus: 0,
      healing: baseHealing,
      armor: baseArmor,
      arcaneDustDelta: baseArcaneDustDelta,
    },
  });

  const damageAfterFlatBonuses = passiveResult.values.damage ?? 0;
  const damagePercentBonus = passiveResult.values.damagePercentBonus ?? 0;
  const finalDamage = damageAfterFlatBonuses > 0
    ? Math.ceil(damageAfterFlatBonuses * (1 + damagePercentBonus / 100))
    : 0;
  const finalHealing = passiveResult.values.healing ?? 0;
  const finalArmor = passiveResult.values.armor ?? 0;
  const arcaneDustDelta = passiveResult.values.arcaneDustDelta ?? baseArcaneDustDelta;
  const nextEnemy = enemy && finalDamage > 0
    ? {
      ...enemy,
      health: Math.max(0, enemy.health - finalDamage),
    }
    : enemy;
  const finalMaxHealth = player.maxHealth + baseMaxHealthIncrease;
  const finalHealth = Math.min(finalMaxHealth, player.health + finalHealing + baseMaxHealthIncrease);
  const nextPlayer = finalHealing > 0 || finalArmor > 0 || baseMaxHealthIncrease > 0
    ? {
      ...player,
      health: finalHealth,
      maxHealth: finalMaxHealth,
      armor: player.armor + finalArmor,
    }
    : player;

  return {
    player: nextPlayer,
    enemy: nextEnemy,
    arcaneDustDelta,
    drawCount: baseDrawCount,
    logs: [...logs, ...passiveResult.logs],
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
