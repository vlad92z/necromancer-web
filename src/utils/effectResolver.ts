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

export interface CastEffectResolutionInput {
  player: Player;
  enemy: Enemy | null;
  castRune: Rune;
  wall: ScoringWall;
  activeArtefacts?: ArtefactId[];
}

export interface CastEffectResolutionResult {
  player: Player;
  enemy: Enemy | null;
  arcaneDustDelta: number;
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
}: CastEffectResolutionInput): CastEffectResolutionResult {
  let baseDamage = 0;
  let baseHealing = 0;
  let baseArmor = 0;
  let baseArcaneDustDelta = 0;
  let projectedEnemyHealth = enemy?.health ?? null;
  let projectedPlayerHealth = player.health;
  let projectedPlayerArmor = player.armor;
  const logs: EffectResolutionLog[] = [];
  const wallRuneCounts = countFilledWallRunesByType(wall);

  castRune.castEffectRefs.forEach((effectRef) => {
    const baseInput = {
      params: effectRef.params ?? {},
      enemyHealth: projectedEnemyHealth,
      playerHealth: projectedPlayerHealth,
      playerArmor: projectedPlayerArmor,
      arcaneDustDelta: baseArcaneDustDelta,
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
      case 'cast.healing': {
        const healing = numberParam(effectRef, 'amount');
        baseHealing += healing;
        projectedPlayerHealth = Math.min(player.maxHealth, projectedPlayerHealth + healing);
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
      case 'cast.channel':
      case 'cast.channelSynergy':
        logs.push(createCastLog(castRune, effectRef, baseInput, { noOp: true }));
        break;
    }
  });

  const passiveResult = resolvePassiveEffects({
    trigger: 'onCast',
    wall,
    activeArtefacts,
    baseValues: {
      damage: baseDamage,
      healing: baseHealing,
      armor: baseArmor,
      arcaneDustDelta: baseArcaneDustDelta,
    },
  });

  const finalDamage = passiveResult.values.damage ?? 0;
  const finalHealing = passiveResult.values.healing ?? 0;
  const finalArmor = passiveResult.values.armor ?? 0;
  const arcaneDustDelta = passiveResult.values.arcaneDustDelta ?? baseArcaneDustDelta;
  const nextEnemy = enemy && finalDamage > 0
    ? {
      ...enemy,
      health: Math.max(0, enemy.health - finalDamage),
    }
    : enemy;
  const nextPlayer = finalHealing > 0 || finalArmor > 0
    ? {
      ...player,
      health: Math.min(player.maxHealth, player.health + finalHealing),
      armor: player.armor + finalArmor,
    }
    : player;

  return {
    player: nextPlayer,
    enemy: nextEnemy,
    arcaneDustDelta,
    logs: [...logs, ...passiveResult.logs],
  };
}
