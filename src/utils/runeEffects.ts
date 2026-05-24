/**
 * runeEffects - helpers for rune effect refs, rarity, and catalog-backed descriptions.
 */

import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createEffectRef, getEffectRefDescriptions } from './effectCatalog';

const BASE_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damageAdjacent', { amount: 1 })],
  Frost: [createEffectRef('cast.armor', { amount: 3 })],
  Life: [createEffectRef('cast.healing', { amount: 2 })],
  Void: [createEffectRef('cast.damageConditional', { amount: 25, threshold: 2, conditionType: 'Void' })],
  Wind: [createEffectRef('cast.fortune', { amount: 10 })],
  Lightning: [],
};

const UNCOMMON_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.synergy', { amount: 5, synergyType: 'Fire' })],
  Frost: [createEffectRef('cast.armorAdjacent', { amount: 3 })],
  Life: [createEffectRef('cast.healthIncrease', { amount: 1 })],
  Void: [],
  Wind: [createEffectRef('cast.drawAdjacent')],
  Lightning: [],
};

const RARE_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('cast.damageFragile', { amount: 25, reduction: 5, fragileType: 'Frost' })],
  Frost: [createEffectRef('cast.armorSynergy', { amount: 5, synergyType: 'Frost' })],
  Life: [],
  Void: [createEffectRef('cast.damageConsuming', { amount: 10 })],
  Wind: [],
  Lightning: [createEffectRef('cast.retriggerAdjacent')],
};

const EPIC_CAST_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [],
  Frost: [],
  Life: [createEffectRef('cast.healSynergy', { amount: 3, synergyType: 'Life' })],
  Void: [],
  Wind: [createEffectRef('cast.returnAdjacent')],
  Lightning: [],
};

const CAST_EFFECT_REFS_BY_RARITY: Record<RuneEffectRarity, Record<RuneType, EffectRef[]>> = {
  common: BASE_CAST_EFFECT_REFS,
  uncommon: UNCOMMON_CAST_EFFECT_REFS,
  rare: RARE_CAST_EFFECT_REFS,
  epic: EPIC_CAST_EFFECT_REFS,
};

const COMMON_PASSIVE_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [],
  Frost: [],
  Life: [],
  Void: [],
  Wind: [],
  Lightning: [createEffectRef('passive.damageBoostSynergy', { percent: 5, synergyType: 'Frost' })],
};

const UNCOMMON_PASSIVE_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [],
  Frost: [],
  Life: [],
  Void: [createEffectRef('passive.pulseSynergy', { amount: 5, synergyType: 'Void' })],
  Wind: [],
  Lightning: [createEffectRef('passive.damageBoostSynergy', { percent: 15, synergyType: 'Lightning' })],
};

const RARE_PASSIVE_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [],
  Frost: [],
  Life: [createEffectRef('passive.healingStartTurn', { amount: 2 })],
  Void: [],
  Wind: [createEffectRef('passive.drawingStartTurn', { amount: 1 })],
  Lightning: [],
};

const EPIC_PASSIVE_EFFECT_REFS: Record<RuneType, EffectRef[]> = {
  Fire: [createEffectRef('passive.addDamage', { amount: 5, runeType: 'Fire' })],
  Frost: [createEffectRef('passive.armorBoost', { amount: 5 })],
  Life: [],
  Void: [createEffectRef('passive.vampire', { percent: 25 })],
  Wind: [],
  Lightning: [createEffectRef('passive.explosive', { amount: 50 })],
};

const PASSIVE_EFFECT_REFS_BY_RARITY: Record<RuneEffectRarity, Record<RuneType, EffectRef[]>> = {
  common: COMMON_PASSIVE_EFFECT_REFS,
  uncommon: UNCOMMON_PASSIVE_EFFECT_REFS,
  rare: RARE_PASSIVE_EFFECT_REFS,
  epic: EPIC_PASSIVE_EFFECT_REFS,
};

export function getRuneCastEffectRefsForType(runeType: RuneType, rarity: RuneEffectRarity = 'common'): EffectRef[] {
  return copyEffectRefs(CAST_EFFECT_REFS_BY_RARITY[rarity][runeType]);
}

export function getRunePassiveEffectRefsForType(runeType: RuneType, rarity: RuneEffectRarity = 'common'): EffectRef[] {
  return copyEffectRefs(PASSIVE_EFFECT_REFS_BY_RARITY[rarity][runeType]);
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
