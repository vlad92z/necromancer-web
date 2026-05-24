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
  if (_rarity === 'common' && _runeType === 'Lightning') {
    return [createEffectRef('passive.damageBoostSynergy', { percent: 5, synergyType: 'Frost' })];
  }

  if (_rarity === 'uncommon' && _runeType === 'Lightning') {
    return [createEffectRef('passive.damageBoostSynergy', { percent: 15, synergyType: 'Lightning' })];
  }

  if (_rarity === 'uncommon' && _runeType === 'Void') {
    return [createEffectRef('passive.pulseSynergy', { amount: 5, synergyType: 'Void' })];
  }

  if (_rarity === 'rare' && _runeType === 'Life') {
    return [createEffectRef('passive.healingStartTurn', { amount: 2 })];
  }

  if (_rarity === 'rare' && _runeType === 'Wind') {
    return [createEffectRef('passive.drawingStartTurn', { amount: 1 })];
  }

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
