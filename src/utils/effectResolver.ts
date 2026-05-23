/**
 * effectResolver - pure effect ref resolution for combat casts.
 */

import type { EffectRef, Enemy, Player, Rune, RuneType, ScoringWall } from '../types/game';
import { EFFECT_CATALOG } from './effectCatalog';
import type { CastEffectId, CatalogEffectId } from './effectCatalog';

export type EffectTrigger = 'onCast';
export type EffectSourceType = 'rune';

export interface EffectResolutionLog {
  sourceType: EffectSourceType;
  sourceId: string;
  effectId: string;
  trigger: EffectTrigger;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  displayHint: string;
}

export interface CastEffectResolutionInput {
  player: Player;
  enemy: Enemy | null;
  castRune: Rune;
  wall: ScoringWall;
}

export interface CastEffectResolutionResult {
  player: Player;
  enemy: Enemy | null;
  arcaneDustDelta: number;
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

function createLog(
  castRune: Rune,
  effectRef: EffectRef,
  input: Record<string, unknown>,
  output: Record<string, unknown>
): EffectResolutionLog {
  const catalogEntry = EFFECT_CATALOG[effectRef.effectId as CatalogEffectId];
  return {
    sourceType: 'rune',
    sourceId: castRune.id,
    effectId: effectRef.effectId,
    trigger: 'onCast',
    input,
    output,
    displayHint: catalogEntry?.displayHint ?? 'unknown',
  };
}

export function resolveCastEffects({
  player,
  enemy,
  castRune,
  wall,
}: CastEffectResolutionInput): CastEffectResolutionResult {
  let nextPlayer = player;
  let nextEnemy = enemy;
  let arcaneDustDelta = 0;
  const logs: EffectResolutionLog[] = [];
  const wallRuneCounts = countFilledWallRunesByType(wall);

  castRune.castEffectRefs.forEach((effectRef) => {
    const baseInput = {
      params: effectRef.params ?? {},
      enemyHealth: nextEnemy?.health ?? null,
      playerHealth: nextPlayer.health,
      playerArmor: nextPlayer.armor,
      arcaneDustDelta,
    };

    if (!isKnownCastEffectId(effectRef.effectId)) {
      logs.push(createLog(castRune, effectRef, baseInput, { noOp: true }));
      return;
    }

    switch (effectRef.effectId) {
      case 'cast.damage': {
        const damage = numberParam(effectRef, 'amount');
        if (nextEnemy) {
          nextEnemy = {
            ...nextEnemy,
            health: Math.max(0, nextEnemy.health - damage),
          };
        }
        logs.push(createLog(castRune, effectRef, baseInput, { damage, enemyHealth: nextEnemy?.health ?? null }));
        break;
      }
      case 'cast.healing': {
        const healing = numberParam(effectRef, 'amount');
        nextPlayer = {
          ...nextPlayer,
          health: Math.min(nextPlayer.maxHealth, nextPlayer.health + healing),
        };
        logs.push(createLog(castRune, effectRef, baseInput, { healing, playerHealth: nextPlayer.health }));
        break;
      }
      case 'cast.armor': {
        const armor = numberParam(effectRef, 'amount');
        nextPlayer = {
          ...nextPlayer,
          armor: nextPlayer.armor + armor,
        };
        logs.push(createLog(castRune, effectRef, baseInput, { armor, playerArmor: nextPlayer.armor }));
        break;
      }
      case 'cast.fortune': {
        const arcaneDust = numberParam(effectRef, 'amount');
        arcaneDustDelta += arcaneDust;
        logs.push(createLog(castRune, effectRef, baseInput, { arcaneDust, arcaneDustDelta }));
        break;
      }
      case 'cast.synergy': {
        const synergyType = runeTypeParam(effectRef, 'synergyType');
        const synergyCount = synergyType ? wallRuneCounts.get(synergyType) ?? 0 : 0;
        const damage = numberParam(effectRef, 'amount') * synergyCount;
        if (nextEnemy) {
          nextEnemy = {
            ...nextEnemy,
            health: Math.max(0, nextEnemy.health - damage),
          };
        }
        logs.push(createLog(castRune, effectRef, baseInput, {
          damage,
          synergyType,
          synergyCount,
          enemyHealth: nextEnemy?.health ?? null,
        }));
        break;
      }
      case 'cast.armorSynergy': {
        const synergyType = runeTypeParam(effectRef, 'synergyType');
        const synergyCount = synergyType ? wallRuneCounts.get(synergyType) ?? 0 : 0;
        const armor = numberParam(effectRef, 'amount') * synergyCount;
        nextPlayer = {
          ...nextPlayer,
          armor: nextPlayer.armor + armor,
        };
        logs.push(createLog(castRune, effectRef, baseInput, {
          armor,
          synergyType,
          synergyCount,
          playerArmor: nextPlayer.armor,
        }));
        break;
      }
      case 'cast.fragile': {
        const fragileType = runeTypeParam(effectRef, 'fragileType');
        const isBlocked = fragileType ? wallHasRuneType(wall, fragileType) : true;
        const damage = isBlocked ? 0 : numberParam(effectRef, 'amount');
        if (nextEnemy) {
          nextEnemy = {
            ...nextEnemy,
            health: Math.max(0, nextEnemy.health - damage),
          };
        }
        logs.push(createLog(castRune, effectRef, baseInput, {
          damage,
          fragileType,
          isBlocked,
          enemyHealth: nextEnemy?.health ?? null,
        }));
        break;
      }
      case 'cast.channel':
      case 'cast.channelSynergy':
        logs.push(createLog(castRune, effectRef, baseInput, { noOp: true }));
        break;
    }
  });

  return {
    player: nextPlayer,
    enemy: nextEnemy,
    arcaneDustDelta,
    logs,
  };
}
