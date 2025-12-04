/**
 * runeEffects - helpers for rune effect definitions and accessors.
 */

import type { RuneEffect, RuneEffectRarity, RuneEffects, RuneType } from '../types/game';

const BASE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [],//[{ type: 'Damage', amount: 1 }],
  Frost:[],// [{ type: 'Healing', amount: 1 }],
  Life: [],//[{ type: 'Healing', amount: 1 }],
  Void: [],//[{ type: 'Damage', amount: 1 }],
  Wind: [],//[{ type: 'Healing', amount: 1 }],
  Lightning: [],//[{ type: 'Damage', amount: 1 }],
};

const UNCOMMON_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 1, rarity: 'uncommon' }],
  Frost: [{ type: 'Healing', amount: 1, rarity: 'uncommon' }],
  Life: [{ type: 'Healing', amount: 1, rarity: 'uncommon' }],
  Void: [{ type: 'Damage', amount: 1, rarity: 'uncommon' }],
  Wind: [{ type: 'Healing', amount: 1, rarity: 'uncommon' }],
  Lightning: [{ type: 'Damage', amount: 1, rarity: 'uncommon' }],
};

const RARE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 2, rarity: 'rare' }],
  Frost: [{ type: 'Healing', amount: 2, rarity: 'rare' }],
  Life: [{ type: 'Healing', amount: 2, rarity: 'rare' }],
  Void: [{ type: 'Damage', amount: 2, rarity: 'rare' }],
  Wind: [{ type: 'Healing', amount: 2, rarity: 'rare' }],
  Lightning: [{ type: 'Damage', amount: 2, rarity: 'rare' }],
};

const EPIC_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 5, rarity: 'epic' }],
  Frost: [{ type: 'Healing', amount: 5, rarity: 'epic' }],
  Life: [{ type: 'Healing', amount: 5, rarity: 'epic' }],
  Void: [{ type: 'Damage', amount: 5, rarity: 'epic' }],
  Wind: [{ type: 'Healing', amount: 5, rarity: 'epic' }],
  Lightning: [{ type: 'Damage', amount: 5, rarity: 'epic' }],
};

function cloneEffects(effects: RuneEffects): RuneEffects {
  return effects.map((effect) => ({ ...effect }));
}

function formatRuneEffect(effect: RuneEffect): string {
  switch (effect.type) {
    case 'Damage':
      return `+${effect.amount} damage`;
    case 'Healing':
      return `+${effect.amount} healing`;
    default:
      return "Common Rune";
  }
}

export function getRuneEffectsForType(runeType: RuneType): RuneEffects {
  const baseEffects = BASE_RUNE_EFFECTS[runeType];

  const tunedEffects = baseEffects.map((effect) => {
    return effect;
  });

  return cloneEffects(tunedEffects);
}

const DRAFT_EFFECTS_BY_RARITY: Record<RuneEffectRarity, Record<RuneType, RuneEffects>> = {
  uncommon: UNCOMMON_RUNE_EFFECTS,
  rare: RARE_RUNE_EFFECTS,
  epic: EPIC_RUNE_EFFECTS,
};

export function getDraftEffectsForType(runeType: RuneType, rarity: RuneEffectRarity = 'uncommon'): RuneEffects {
  return cloneEffects(DRAFT_EFFECTS_BY_RARITY[rarity][runeType]);
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
    return `${runeType} rune`;
  }

  const bulletList = effectLines.map((line) => `${line}`).join('\n');
  return `${runeType} rune\n${bulletList}`;
}

const RARITY_ORDER: RuneEffectRarity[] = ['uncommon', 'rare', 'epic'];

export function getRuneRarity(effects: RuneEffects | null | undefined): RuneEffectRarity | null {
  if (!effects || effects.length === 0) {
    return null;
  }

  return effects.reduce<RuneEffectRarity>((highest, effect) => {
    const currentIndex = RARITY_ORDER.indexOf(highest);
    const nextIndex = RARITY_ORDER.indexOf(effect.rarity);
    return nextIndex > currentIndex ? effect.rarity : highest;
  }, effects[0].rarity);
}
