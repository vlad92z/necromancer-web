/**
 * runeEffects - helpers for rune effect definitions and accessors.
 */

import type { RuneEffect, RuneEffects, RuneType } from '../types/game';

export interface RuneEffectTuning {
  lifeHealing?: number;
}

const BASE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 1 }],
  Frost: [{ type: 'Healing', amount: 1 }],
  Life: [{ type: 'Healing', amount: 1 }],
  Void: [{ type: 'Damage', amount: 1 }],
  Wind: [{ type: 'Healing', amount: 1 }],
  Lightning: [{ type: 'Damage', amount: 1 }],
};

function cloneEffects(effects: RuneEffects): RuneEffects {
  return effects.map((effect) => ({ ...effect }));
}

export function getRuneEffectsForType(runeType: RuneType, tuning?: RuneEffectTuning): RuneEffects {
  const baseEffects = BASE_RUNE_EFFECTS[runeType];

  if (!tuning) {
    return cloneEffects(baseEffects);
  }

  const tunedEffects = baseEffects.map((effect) => {
    if (effect.type === 'Healing' && tuning.lifeHealing !== undefined) {
      return { ...effect, amount: tuning.lifeHealing };
    }

    return effect;
  });

  return cloneEffects(tunedEffects);
}

export function copyRuneEffects(effects: RuneEffects | null | undefined): RuneEffects {
  if (!effects) {
    return [];
  }
  return cloneEffects(effects);
}

export function getEffectValue(
  effects: RuneEffects | null | undefined,
  type: Extract<RuneEffect, { amount: number }>['type']
): number {
  if (!effects) return 0;
  return effects.reduce((total, effect) => {
    return effect.type === type && 'amount' in effect ? total + effect.amount : total;
  }, 0);
}

export function hasEffectType(
  effects: RuneEffects | null | undefined,
  type: RuneEffect['type']
): boolean {
  if (!effects) return false;
  return effects.some((effect) => effect.type === type);
}
