/**
 * runeEffects - helpers for rune effect refs, rarity, and catalog-backed descriptions.
 */

import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createEffectRef, getEffectRefDescriptions } from './effectCatalog';

const BASE_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 3 })],
  Frost: [createEffectRef('cast.armor', { amount: 3 })],
  Life: [createEffectRef('cast.healing', { amount: 5 })],
  Void: [createEffectRef('cast.damage', { amount: 3 })],
  Wind: [createEffectRef('cast.damage', { amount: 3 })],
  Lightning: [createEffectRef('cast.damage', { amount: 3 })],
};

const UNCOMMON_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 3 })],
  Frost: [createEffectRef('cast.armor', { amount: 2 })],
  Life: [createEffectRef('cast.healing', { amount: 2 })],
  Void: [createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' })],
  Wind: [createEffectRef('cast.fortune', { amount: 5 })],
  Lightning: [createEffectRef('cast.channelSynergy', { amount: 1, synergyType: 'Lightning' })],
};

const RARE_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 4 })],
  Frost: [createEffectRef('cast.armorSynergy', { amount: 3, synergyType: 'Frost' })],
  Life: [createEffectRef('cast.healing', { amount: 3 })],
  Void: [createEffectRef('cast.synergy', { amount: 3, synergyType: 'Void' })],
  Wind: [createEffectRef('cast.fortune', { amount: 10 })],
  Lightning: [createEffectRef('cast.channelSynergy', { amount: 2, synergyType: 'Lightning' })],
};

const EPIC_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 8 })],
  Frost: [createEffectRef('cast.armorSynergy', { amount: 6, synergyType: 'Frost' })],
  Life: [createEffectRef('cast.healing', { amount: 6 })],
  Void: [createEffectRef('cast.synergy', { amount: 6, synergyType: 'Void' })],
  Wind: [createEffectRef('cast.fortune', { amount: 20 })],
  Lightning: [createEffectRef('cast.channelSynergy', { amount: 4, synergyType: 'Lightning' })],
};

const CAST_EFFECT_REFS_BY_RARITY: Record<RuneEffectRarity, Record<RuneType, EffectRef[]>> = {
  common: BASE_CAST_EFFECT_REFS,
  uncommon: UNCOMMON_CAST_EFFECT_REFS,
  rare: RARE_CAST_EFFECT_REFS,
  epic: EPIC_CAST_EFFECT_REFS,
};

export function getRuneCastEffectRefsForType(runeType: RuneType, rarity: RuneEffectRarity = 'common'): EffectRef[] {
  return copyEffectRefs(CAST_EFFECT_REFS_BY_RARITY[rarity][runeType]);
}

export function getRunePassiveEffectRefsForType(_runeType: RuneType, _rarity: RuneEffectRarity = 'common'): EffectRef[] {
  void _runeType;
  void _rarity;
  return [];
}

export function copyEffectRefs(effectRefs: EffectRef[] | null | undefined): EffectRef[] {
  if (!effectRefs) {
    return [];
  }
  return effectRefs.map((effectRef) => ({
    effectId: effectRef.effectId,
    ...(effectRef.params ? { params: { ...effectRef.params } } : {}),
  }));
}

export function createRune(
  id: string,
  runeType: RuneType,
  rarity: RuneEffectRarity = 'common'
): Rune {
  return {
    id,
    runeType,
    rarity,
    castEffectRefs: getRuneCastEffectRefsForType(runeType, rarity),
    passiveEffectRefs: getRunePassiveEffectRefsForType(runeType, rarity),
  };
}

export function getRuneEffectDescription(rune: Rune | null | undefined): string {
  if (!rune) {
    return '';
  }

  const effectLines = [
    ...getEffectRefDescriptions(rune.castEffectRefs),
    ...getEffectRefDescriptions(rune.passiveEffectRefs),
  ];
  return effectLines.map((line) => `• ${line}`).join('\n');
}
