/**
 * runeEffects - helpers for rune effect refs, rarity, and catalog-backed descriptions.
 */

import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createEffectRef, getEffectRefDescriptions } from './effectCatalog';

const BASE_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 3 })],
  Frost: [createEffectRef('cast.armor', { amount: 5 })],
  Life: [createEffectRef('cast.healing', { amount: 2 })],
  Void: [createEffectRef('cast.damage', { amount: 3 })],
  Wind: [createEffectRef('cast.damage', { amount: 3 })],
  Lightning: [createEffectRef('cast.damage', { amount: 3 })],
};

const UNCOMMON_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 6 })],
  Frost: [createEffectRef('cast.armor', { amount: 10 })],
  Life: [createEffectRef('cast.healing', { amount: 4 })],
  Void: [createEffectRef('cast.synergy', { amount: 4, synergyType: 'Void' })],
  Wind: [createEffectRef('cast.fortune', { amount: 10 })],
  Lightning: [createEffectRef('cast.damage', { amount: 6, synergyType: 'Lightning' })],
};

const RARE_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 10 })],
  Frost: [createEffectRef('cast.armorSynergy', { amount: 10, synergyType: 'Frost' })],
  Life: [createEffectRef('cast.healing', { amount: 5 })],
  Void: [createEffectRef('cast.synergy', { amount: 8, synergyType: 'Void' })],
  Wind: [createEffectRef('cast.fortune', { amount: 25 })],
  Lightning: [createEffectRef('cast.damage', { amount: 10, synergyType: 'Lightning' })],
};

const EPIC_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damage', { amount: 20 })],
  Frost: [createEffectRef('cast.armorSynergy', { amount: 20, synergyType: 'Frost' })],
  Life: [createEffectRef('cast.healing', { amount: 10 })],
  Void: [createEffectRef('cast.synergy', { amount: 15, synergyType: 'Void' })],
  Wind: [createEffectRef('cast.fortune', { amount: 30 })],
  Lightning: [createEffectRef('cast.damage', { amount: 20, synergyType: 'Lightning' })],
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
