/**
 * runeEffects - helpers for rune effect definitions and accessors.
 */

import type { RuneEffect, RuneEffects, RuneType } from '../types/game';

export interface RuneEffectTuning {
  lifeHealing?: number;
}

const BASE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [],//[{ type: 'Damage', amount: 1 }],
  Frost:[],// [{ type: 'Healing', amount: 1 }],
  Life: [],//[{ type: 'Healing', amount: 1 }],
  Void: [],//[{ type: 'Damage', amount: 1 }],
  Wind: [],//[{ type: 'Healing', amount: 1 }],
  Lightning: [],//[{ type: 'Damage', amount: 1 }],
};

const UNCOMMON_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 1 }],
  Frost: [{ type: 'Healing', amount: 1 }],
  Life: [{ type: 'Healing', amount: 1 }],
  Void: [{ type: 'Damage', amount: 1 }],
  Wind: [{ type: 'Healing', amount: 1 }],
  Lightning: [{ type: 'Damage', amount: 1 }],
};

const RARE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 2 }],
  Frost: [{ type: 'Healing', amount: 2 }],
  Life: [{ type: 'Healing', amount: 2 }],
  Void: [{ type: 'Damage', amount: 2 }],
  Wind: [{ type: 'Healing', amount: 2 }],
  Lightning: [{ type: 'Damage', amount: 2 }],
};

const EPIC_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 5 }],
  Frost: [{ type: 'Healing', amount: 5 }],
  Life: [{ type: 'Healing', amount: 5 }],
  Void: [{ type: 'Damage', amount: 5 }],
  Wind: [{ type: 'Healing', amount: 5 }],
  Lightning: [{ type: 'Damage', amount: 5 }],
};

function cloneEffects(effects: RuneEffects): RuneEffects {
  return effects.map((effect) => ({ ...effect }));
}

function formatRuneEffect(effect: RuneEffect): string {
  switch (effect.type) {
    case 'Damage':
      return `+${effect.amount} damage when placed`;
    case 'Healing':
      return `Restore ${effect.amount} health when scored`;
    case 'DamageToSpellpower':
      return `+${effect.amount} spellpower damage`;
    case 'EssenceBonus':
      return `Essence bonus +${effect.amount}`;
    case 'FloorPenaltyMitigation':
      return `Reduce floor penalties by ${effect.amount}`;
    case 'DestroyRune':
      return 'Void: destroy 1 rune from a runeforge or the center';
    case 'FreezePatternLine':
      return 'Frost: freeze an opponent pattern line (versus only)';
    default:
      return "Common Rune";
  }
}

export function getRuneEffectsForType(runeType: RuneType, tuning?: RuneEffectTuning): RuneEffects {
  const baseEffects = BASE_RUNE_EFFECTS[runeType];

  if (!tuning) {
    return cloneEffects(baseEffects);
  }

  const tunedEffects = baseEffects.map((effect) => {
    return effect;
  });

  return cloneEffects(tunedEffects);
}

export function getDraftEffectsForType(runeType: RuneType): RuneEffects {
  return cloneEffects(UNCOMMON_RUNE_EFFECTS[runeType]);
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

export function getRuneEffectDescription(runeType: RuneType, effects: RuneEffects | null | undefined): string {
  const resolvedEffects = effects ?? [];
  const effectLines = resolvedEffects.map(formatRuneEffect).filter(Boolean);

  if (effectLines.length === 0) {
    return `${runeType} rune\n• No special effects`;
  }

  const bulletList = effectLines.map((line) => `• ${line}`).join('\n');
  return `${runeType} rune\n${bulletList}`;
}
