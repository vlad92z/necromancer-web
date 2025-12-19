/**
 * runeEffects - helpers for rune effect definitions and accessors.
 */

import type { RuneEffect, RuneRarity, RuneType } from '../types/game';

const BASE_RUNE_EFFECTS: Record<RuneType, RuneEffect> = {
  Fire: { type: 'Damage', amount: 1 },
  Frost:{ type: 'Armor', amount: 1 },
  Life: { type: 'Healing', amount: 1 },
  Void: { type: 'Damage', amount: 1 },
  Wind: { type: 'Damage', amount: 1 },
  Lightning: { type: 'Damage', amount: 1 },
};

const UNCOMMON_RUNE_EFFECTS: Record<RuneType, RuneEffect> = {
  Fire: { type: 'Damage', amount: 3 },
  Frost: { type: 'Armor', amount: 2 },
  Life: { type: 'Healing', amount: 2 },
  Void: { type: 'Synergy', amount: 2, synergyType: 'Void' },
  Wind: { type: 'Fortune', amount: 5 },
  Lightning: { type: 'ChannelSynergy', amount: 1, synergyType: 'Lightning' },
};

const RARE_RUNE_EFFECTS: Record<RuneType, RuneEffect> = {
  Fire: { type: 'Damage', amount: 4 },
  Frost: { type: 'ArmorSynergy', amount: 3, synergyType: 'Frost' },
  Life: { type: 'Healing', amount: 3 },
  Void: { type: 'Synergy', amount: 3, synergyType: 'Void' },
  Wind: { type: 'Fortune', amount: 10 },
  Lightning: { type: 'ChannelSynergy', amount: 2, synergyType: 'Lightning' },
};

const EPIC_RUNE_EFFECTS: Record<RuneType, RuneEffect> = {
  Fire: { type: 'Damage', amount: 8 },
  Frost: { type: 'ArmorSynergy', amount: 6, synergyType: 'Frost' },
  Life: { type: 'Healing', amount: 6 },
  Void: { type: 'Synergy', amount: 6, synergyType: 'Void' },
  Wind: { type: 'Fortune', amount: 20 },
  Lightning: { type: 'ChannelSynergy', amount: 4, synergyType: 'Lightning' },
};

export function getRuneEffectDescription(effect: RuneEffect): string {
  switch (effect.type) {
    case 'Damage':
      return `Add ${effect.amount} rune score on cast`;
    case 'Healing':
      return `Heal ${effect.amount} on cast`;
    case 'Synergy':
      return `Gain ${effect.amount} rune score for every ${effect.synergyType} rune in segment`;
    case 'Fortune':
      return `Gain ${effect.amount} arcane dust on cast`;
    case 'Fragile':
      return `+${effect.amount} rune score if the segment contains no ${effect.fragileType} runes.`;
    case 'Channel':
      return `+${effect.amount} rune score when overloaded`;
    case 'ChannelSynergy':
      return `Gain ${effect.amount} rune score per overloaded ${effect.synergyType} rune on cast`;
    case 'Armor':
      return `Gain ${effect.amount} armor on cast`;
    case 'ArmorSynergy':
      return `Gain ${effect.amount} armor for every ${effect.synergyType} rune in segment on cast`;
  }
}

export function getBaseRuneEffectsForType(runeType: RuneType): RuneEffect {
  return BASE_RUNE_EFFECTS[runeType];
}

const DRAFT_EFFECTS_BY_RARITY: Record<RuneRarity, Record<RuneType, RuneEffect>> = {
  common: BASE_RUNE_EFFECTS,
  uncommon: UNCOMMON_RUNE_EFFECTS,
  rare: RARE_RUNE_EFFECTS,
  epic: EPIC_RUNE_EFFECTS,
};

export function getEffectsForType(runeType: RuneType, rarity: RuneRarity = 'uncommon'): RuneEffect {
  return DRAFT_EFFECTS_BY_RARITY[rarity][runeType];
}
