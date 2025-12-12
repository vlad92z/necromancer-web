/**
 * runeEffects - helpers for rune effect definitions and accessors.
 */

import type { RuneEffect, RuneEffectRarity, RuneEffects, RuneType } from '../types/game';

const BASE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 1, rarity: 'common' }],
  Frost:[{ type: 'Damage', amount: 1, rarity: 'common' }],
  Life: [{ type: 'Healing', amount: 1, rarity: 'common' }],
  Void: [{ type: 'Damage', amount: 1, rarity: 'common' }],
  Wind: [{ type: 'Damage', amount: 1, rarity: 'common' }],
  Lightning: [{ type: 'Damage', amount: 1, rarity: 'common' }],
};

const UNCOMMON_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 3, rarity: 'uncommon' }],
  Frost: [{ type: 'Fragile', amount: 5, fragileType: 'Fire', rarity: 'uncommon' }],
  Life: [{ type: 'Healing', amount: 3, rarity: 'uncommon' }],
  Void: [{ type: 'Synergy', amount: 2, synergyType: 'Void', rarity: 'uncommon' }],
  Wind: [{ type: 'Fortune', amount: 5, rarity: 'uncommon' }],
  Lightning: [{ type: 'Synergy', amount: 3, synergyType: 'Frost', rarity: 'uncommon' }],
};

const RARE_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 5, rarity: 'rare' }],
  Frost: [{ type: 'Fragile', amount: 9, fragileType: 'Fire', rarity: 'rare' }],
  Life: [{ type: 'Healing', amount: 5, rarity: 'rare' }],
  Void: [{ type: 'Synergy', amount: 3, synergyType: 'Void', rarity: 'rare' }],
  Wind: [{ type: 'Fortune', amount: 10, rarity: 'rare' }],
  Lightning: [{ type: 'Synergy', amount: 4, synergyType: 'Frost', rarity: 'rare' }],
};

const EPIC_RUNE_EFFECTS: Record<RuneType, RuneEffects> = {
  Fire: [{ type: 'Damage', amount: 8, rarity: 'epic' }],
  Frost: [{ type: 'Fragile', amount: 12, fragileType: 'Fire', rarity: 'epic' }],
  Life: [{ type: 'Healing', amount: 8, rarity: 'epic' }],
  Void: [{ type: 'Synergy', amount: 5, synergyType: 'Void', rarity: 'epic' }],
  Wind: [{ type: 'Fortune', amount: 15, rarity: 'epic' }],
  Lightning: [{ type: 'Synergy', amount: 6, synergyType: 'Frost', rarity: 'epic' }],
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
    case 'Synergy':
      return `+${effect.amount} damage for every ${effect.synergyType} rune`;
    case 'Fortune':
      return `+${effect.amount} Arcane Dust`;
    case 'Fragile':
      return `+${effect.amount} damage, negated by ${effect.fragileType}`;
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
  common: BASE_RUNE_EFFECTS,
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

export function getRuneEffectDescription(effects: RuneEffects | null | undefined): string {
  const resolvedEffects = effects ?? [];
  const effectLines = resolvedEffects.map(formatRuneEffect).filter(Boolean);
  const bulletList = effectLines.map((line) => `${line}`).join('\n');
  return `${bulletList}`;
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
