/**
 * runeEffects - helpers for rune effect definitions and accessors.
 */

import type { ActiveRuneEffect, PassiveRuneEffect, RuneEffects, RuneType } from '../types/game';

export interface RuneEffectTuning {
  lifeHealing?: number;
  frostMitigation?: number;
  voidConversion?: number;
}

/**
 * Legacy rune effects preserved for future use.
 */
export const LEGACY_RUNE_EFFECTS: Pick<Record<RuneType, RuneEffects>, 'Frost' | 'Void'> = {
  Frost: {
    passive: [],
    active: [{ type: 'FreezePatternLine' }],
  },
  Void: {
    passive: [],
    active: [{ type: 'DestroyRune' }],
  },
};

const BASE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: {
    passive: [{ type: 'EssenceBonus', amount: 1 }],
    active: [],
  },
  Frost: {
    passive: [{ type: 'StrainMitigation', amount: 0.1 }],
    active: [],
  },
  Life: {
    passive: [{ type: 'Healing', amount: 10 }],
    active: [],
  },
  Void: {
    passive: [{ type: 'DamageToSpellpower', amount: 0.1 }],
    active: [],
  },
  Wind: {
    passive: [{ type: 'FloorPenaltyMitigation', amount: 1 }],
    active: [],
  },
};

function cloneEffects(effects: RuneEffects): RuneEffects {
  return {
    passive: effects.passive.map((effect) => ({ ...effect })),
    active: effects.active.map((effect) => ({ ...effect })),
  };
}

export function getRuneEffectsForType(runeType: RuneType, tuning?: RuneEffectTuning): RuneEffects {
  const baseEffects = BASE_RUNE_EFFECTS[runeType];

  if (!tuning) {
    return cloneEffects(baseEffects);
  }

  const tunedPassive = baseEffects.passive.map((effect) => {
    if (effect.type === 'Healing' && tuning.lifeHealing !== undefined) {
      return { ...effect, amount: tuning.lifeHealing };
    }

    if (effect.type === 'StrainMitigation' && tuning.frostMitigation !== undefined) {
      return { ...effect, amount: tuning.frostMitigation };
    }

    if (effect.type === 'DamageToSpellpower' && tuning.voidConversion !== undefined) {
      return { ...effect, amount: tuning.voidConversion };
    }

    return effect;
  });

  return cloneEffects({
    ...baseEffects,
    passive: tunedPassive,
  });
}

export function copyRuneEffects(effects: RuneEffects | null | undefined): RuneEffects {
  if (!effects) {
    return { passive: [], active: [] };
  }
  return cloneEffects(effects);
}

export function getPassiveEffectValue(
  effects: RuneEffects | null | undefined,
  type: PassiveRuneEffect['type']
): number {
  if (!effects) return 0;
  return effects.passive.reduce((total, effect) => {
    return effect.type === type ? total + effect.amount : total;
  }, 0);
}

export function hasActiveEffect(
  effects: RuneEffects | null | undefined,
  type: ActiveRuneEffect['type']
): boolean {
  if (!effects) return false;
  return effects.active.some((effect) => effect.type === type);
}
