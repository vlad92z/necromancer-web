/**
 * effectCatalog - central metadata and description helpers for effect refs.
 */

import type { EffectParams, EffectRef, EffectTrigger, RuneEffectRef, RuneType } from '../types/game';
import { isRuneRemovalEffectRef } from './runeRemoval';

export type CastEffectId =
  | 'cast.damage'
  | 'cast.damageAdjacent'
  | 'cast.damageBoard'
  | 'cast.damageConditional'
  | 'cast.damageFragile'
  | 'cast.convertRandom'
  | 'cast.convertAdjacent'
  | 'cast.retriggerAdjacent'
  | 'cast.retriggerType'
  | 'cast.healing'
  | 'cast.healSynergy'
  | 'cast.shield'
  | 'cast.shieldAdjacent'
  | 'cast.healthIncrease'
  | 'cast.healthDecrease'
  | 'cast.draw'
  | 'cast.drawType'
  | 'cast.drawAdjacent'
  | 'cast.returnAdjacent'
  | 'cast.arcaneDustAdjacent'
  | 'cast.fortune'
  | 'cast.synergy'
  | 'cast.shieldSynergy'
  | 'cast.fragile';

export type PassiveEffectId =
  | 'passive.rodHealing'
  | 'passive.potionShield'
  | 'passive.tomeCastDamage'
  | 'passive.damageBoost'
  | 'passive.adjacentDamageBoost'
  | 'passive.damageBoostSynergy'
  | 'passive.damageEndTurn'
  | 'passive.pulseSynergy'
  | 'passive.shieldEndTurnSynergy'
  | 'passive.healingStartTurn'
  | 'passive.healingStartTurnSynergy'
  | 'passive.drawingStartTurn'
  | 'passive.ringManaStartTurn'
  | 'passive.addDamage'
  | 'passive.shieldBoost'
  | 'passive.explosive'
  | 'passive.vampire'
  | 'passive.reduceDamage';

export type CatalogEffectId = CastEffectId | PassiveEffectId;
export type PassiveStackingKind = 'flat' | 'multiplier';

export interface PassiveEffectMetadata {
  trigger: EffectTrigger;
  target: string;
  stacking: PassiveStackingKind;
  paramKey: string;
  defaultValue: number;
  priority?: number;
}

export interface EffectCatalogEntry {
  id: CatalogEffectId;
  kind: 'cast' | 'passive';
  title: string;
  displayHint: string;
  passive?: PassiveEffectMetadata;
  describe: (params: EffectParams) => string;
}

function numberParam(params: EffectParams, key: string, fallback: number = 0): number {
  const value = params[key];
  return typeof value === 'number' ? value : fallback;
}

function runeTypeParam(params: EffectParams, key: string, fallback: RuneType = 'Fire'): RuneType {
  const value = params[key];
  return typeof value === 'string' ? value as RuneType : fallback;
}

export const EFFECT_CATALOG: Record<CatalogEffectId, EffectCatalogEntry> = {
  'cast.damage': {
    id: 'cast.damage',
    kind: 'cast',
    title: 'Damage',
    displayHint: 'damage',
    describe: (params) => `Deal ${numberParam(params, 'amount')} damage`,
  },
  'cast.damageAdjacent': {
    id: 'cast.damageAdjacent',
    kind: 'cast',
    title: 'Adjacent Damage',
    displayHint: 'damage',
    describe: (params) => `Deal ${numberParam(params, 'amount')} damage for every adjacent ${params.runeType ? `${runeTypeParam(params, 'runeType')} ` : ''}rune`,
  },
  'cast.damageBoard': {
    id: 'cast.damageBoard',
    kind: 'cast',
    title: 'Board Damage',
    displayHint: 'damage',
    describe: (params) => `Deal ${numberParam(params, 'amount')} damage for every rune on your completed wall`,
  },
  'cast.damageConditional': {
    id: 'cast.damageConditional',
    kind: 'cast',
    title: 'Conditional Damage',
    displayHint: 'damage',
    describe: (params) =>
      `Deal ${numberParam(params, 'amount')} damage if at least ${numberParam(params, 'threshold')} ${runeTypeParam(params, 'conditionType')} runes are in your completed wall`,
  },
  'cast.damageFragile': {
    id: 'cast.damageFragile',
    kind: 'cast',
    title: 'Fragile Damage',
    displayHint: 'damage',
    describe: (params) =>
      `Deal ${numberParam(params, 'amount')} damage, reduced by ${numberParam(params, 'reduction')} for every ${runeTypeParam(params, 'fragileType')} rune in your completed wall`,
  },
  'cast.convertRandom': {
    id: 'cast.convertRandom',
    kind: 'cast',
    title: 'Random Convert',
    displayHint: 'deck',
    describe: (params) =>
      `Convert a random completed ${runeTypeParam(params, 'sourceType')} rune into a common ${runeTypeParam(params, 'targetType')} rune with no effects`,
  },
  'cast.convertAdjacent': {
    id: 'cast.convertAdjacent',
    kind: 'cast',
    title: 'Adjacent Convert',
    displayHint: 'deck',
    describe: (params) => `Convert adjacent runes into ${runeTypeParam(params, 'targetType')} runes`,
  },
  'cast.retriggerAdjacent': {
    id: 'cast.retriggerAdjacent',
    kind: 'cast',
    title: 'Adjacent Retrigger',
    displayHint: 'damage',
    describe: () => 'Retrigger adjacent runes',
  },
  'cast.retriggerType': {
    id: 'cast.retriggerType',
    kind: 'cast',
    title: 'Type Retrigger',
    displayHint: 'damage',
    describe: (params) => `Retrigger all ${runeTypeParam(params, 'targetType')} runes`,
  },
  'cast.healing': {
    id: 'cast.healing',
    kind: 'cast',
    title: 'Healing',
    displayHint: 'healing',
    describe: (params) => `Heal ${numberParam(params, 'amount')}`,
  },
  'cast.healSynergy': {
    id: 'cast.healSynergy',
    kind: 'cast',
    title: 'Healing Synergy',
    displayHint: 'healing',
    describe: (params) =>
      `Heal ${numberParam(params, 'amount')} for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'cast.shield': {
    id: 'cast.shield',
    kind: 'cast',
    title: 'Shield',
    displayHint: 'shield',
    describe: (params) => `Shield ${numberParam(params, 'amount')}`,
  },
  'cast.shieldAdjacent': {
    id: 'cast.shieldAdjacent',
    kind: 'cast',
    title: 'Adjacent Shield',
    displayHint: 'shield',
    describe: (params) => `Shield ${numberParam(params, 'amount')} for every adjacent rune`,
  },
  'cast.healthIncrease': {
    id: 'cast.healthIncrease',
    kind: 'cast',
    title: 'Health Increase',
    displayHint: 'healing',
    describe: (params) => `Increase maximum health by ${numberParam(params, 'amount')}`,
  },
  'cast.healthDecrease': {
    id: 'cast.healthDecrease',
    kind: 'cast',
    title: 'Health Decrease',
    displayHint: 'damage',
    describe: (params) => `Reduce maximum health by ${numberParam(params, 'amount')}`,
  },
  'cast.draw': {
    id: 'cast.draw',
    kind: 'cast',
    title: 'Draw',
    displayHint: 'deck',
    describe: (params) => `Draw ${numberParam(params, 'amount')} rune`,
  },
  'cast.drawType': {
    id: 'cast.drawType',
    kind: 'cast',
    title: 'Typed Draw',
    displayHint: 'deck',
    describe: (params) => `Draw ${numberParam(params, 'amount')} ${runeTypeParam(params, 'targetType')} rune`,
  },
  'cast.drawAdjacent': {
    id: 'cast.drawAdjacent',
    kind: 'cast',
    title: 'Adjacent Draw',
    displayHint: 'deck',
    describe: () => 'Draw one rune for every adjacent rune',
  },
  'cast.returnAdjacent': {
    id: 'cast.returnAdjacent',
    kind: 'cast',
    title: 'Adjacent Return',
    displayHint: 'deck',
    describe: () => 'Return adjacent runes to your hand',
  },
  'cast.arcaneDustAdjacent': {
    id: 'cast.arcaneDustAdjacent',
    kind: 'cast',
    title: 'Adjacent Arcane Dust',
    displayHint: 'arcaneDust',
    describe: (params) => `Gain ${numberParam(params, 'amount')} arcane dust for every adjacent rune`,
  },
  'cast.fortune': {
    id: 'cast.fortune',
    kind: 'cast',
    title: 'Fortune',
    displayHint: 'arcaneDust',
    describe: (params) => `Gain ${numberParam(params, 'amount')} arcane dust`,
  },
  'cast.synergy': {
    id: 'cast.synergy',
    kind: 'cast',
    title: 'Synergy',
    displayHint: 'damage',
    describe: (params) =>
      `Deal ${numberParam(params, 'amount')} damage for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'cast.shieldSynergy': {
    id: 'cast.shieldSynergy',
    kind: 'cast',
    title: 'Shield Synergy',
    displayHint: 'shield',
    describe: (params) =>
      `Shield ${numberParam(params, 'amount')} for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'cast.fragile': {
    id: 'cast.fragile',
    kind: 'cast',
    title: 'Fragile',
    displayHint: 'damage',
    describe: (params) =>
      `Deal ${numberParam(params, 'amount')} damage if your completed wall has no ${runeTypeParam(params, 'fragileType')} runes`,
  },
  'passive.rodHealing': {
    id: 'passive.rodHealing',
    kind: 'passive',
    title: 'Healing Multiplier',
    displayHint: 'healing',
    passive: {
      trigger: 'onCast',
      target: 'healing',
      stacking: 'multiplier',
      paramKey: 'healingMultiplier',
      defaultValue: 1,
    },
    describe: () => 'Double all healing',
  },
  'passive.potionShield': {
    id: 'passive.potionShield',
    kind: 'passive',
    title: 'Shield Multiplier',
    displayHint: 'shield',
    passive: {
      trigger: 'onCast',
      target: 'shield',
      stacking: 'multiplier',
      paramKey: 'shieldMultiplier',
      defaultValue: 1,
    },
    describe: () => 'Double all shield gained',
  },
  'passive.tomeCastDamage': {
    id: 'passive.tomeCastDamage',
    kind: 'passive',
    title: 'Cast Damage',
    displayHint: 'damage',
    passive: {
      trigger: 'onCast',
      target: 'damage',
      stacking: 'flat',
      paramKey: 'damageBonus',
      defaultValue: 0,
    },
    describe: (params) => `+${numberParam(params, 'damageBonus', 1)} damage on all casts`,
  },
  'passive.damageBoost': {
    id: 'passive.damageBoost',
    kind: 'passive',
    title: 'Damage Boost',
    displayHint: 'damage',
    describe: (params) => `Increase all damage by ${numberParam(params, 'amount')}`,
  },
  'passive.adjacentDamageBoost': {
    id: 'passive.adjacentDamageBoost',
    kind: 'passive',
    title: 'Adjacent Damage Boost',
    displayHint: 'damage',
    describe: (params) => `Adjacent runes deal +${numberParam(params, 'amount')} damage`,
  },
  'passive.damageBoostSynergy': {
    id: 'passive.damageBoostSynergy',
    kind: 'passive',
    title: 'Synergy Damage Boost',
    displayHint: 'damage',
    passive: {
      trigger: 'onCast',
      target: 'damagePercentBonus',
      stacking: 'multiplier',
      paramKey: 'percent',
      defaultValue: 0,
    },
    describe: (params) =>
      `Increase all damage by ${numberParam(params, 'percent')}% for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall, including the triggering rune if it matches`,
  },
  'passive.pulseSynergy': {
    id: 'passive.pulseSynergy',
    kind: 'passive',
    title: 'Synergy Pulse',
    displayHint: 'damage',
    passive: {
      trigger: 'endTurn',
      target: 'damage',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) =>
      `At end of turn, deal ${numberParam(params, 'amount')} damage for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'passive.damageEndTurn': {
    id: 'passive.damageEndTurn',
    kind: 'passive',
    title: 'End Turn Damage',
    displayHint: 'damage',
    passive: {
      trigger: 'endTurn',
      target: 'damage',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `At the end of your turn, deal ${numberParam(params, 'amount')} damage`,
  },
  'passive.shieldEndTurnSynergy': {
    id: 'passive.shieldEndTurnSynergy',
    kind: 'passive',
    title: 'End Turn Shield Synergy',
    displayHint: 'shield',
    passive: {
      trigger: 'endTurn',
      target: 'shield',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) =>
      `At end of turn, Shield ${numberParam(params, 'amount')} for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'passive.healingStartTurn': {
    id: 'passive.healingStartTurn',
    kind: 'passive',
    title: 'Start Turn Healing',
    displayHint: 'healing',
    passive: {
      trigger: 'startTurn',
      target: 'healing',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `At start of turn, heal ${numberParam(params, 'amount')}`,
  },
  'passive.healingStartTurnSynergy': {
    id: 'passive.healingStartTurnSynergy',
    kind: 'passive',
    title: 'Start Turn Healing Synergy',
    displayHint: 'healing',
    passive: {
      trigger: 'startTurn',
      target: 'healing',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) =>
      `At start of turn, heal ${numberParam(params, 'amount')} for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'passive.drawingStartTurn': {
    id: 'passive.drawingStartTurn',
    kind: 'passive',
    title: 'Start Turn Draw',
    displayHint: 'deck',
    passive: {
      trigger: 'startTurn',
      target: 'drawCount',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `At start of turn, draw ${numberParam(params, 'amount')} additional runes`,
  },
  'passive.ringManaStartTurn': {
    id: 'passive.ringManaStartTurn',
    kind: 'passive',
    title: 'Start Turn Mana',
    displayHint: 'mana',
    passive: {
      trigger: 'startTurn',
      target: 'mana',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `At start of turn, gain ${numberParam(params, 'amount')} mana`,
  },
  'passive.addDamage': {
    id: 'passive.addDamage',
    kind: 'passive',
    title: 'Type Damage',
    displayHint: 'damage',
    passive: {
      trigger: 'onCast',
      target: 'damage',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `${runeTypeParam(params, 'runeType')} runes deal +${numberParam(params, 'amount')} damage`,
  },
  'passive.shieldBoost': {
    id: 'passive.shieldBoost',
    kind: 'passive',
    title: 'Shield Boost',
    displayHint: 'shield',
    passive: {
      trigger: 'onCast',
      target: 'shield',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `Increase all shield gained by ${numberParam(params, 'amount')}`,
  },
  'passive.explosive': {
    id: 'passive.explosive',
    kind: 'passive',
    title: 'Explosive',
    displayHint: 'damage',
    passive: {
      trigger: 'onRuneRemoved',
      target: 'explosiveDamage',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => {
      const removalKind = params.removalKind;
      return `Deal ${numberParam(params, 'amount')} damage when ${removalKind === 'consume' ? 'consumed' : removalKind === 'destroy' ? 'destroyed' : removalKind === 'transform' ? 'transformed' : 'consumed, destroyed, or transformed'}`;
    },
  },
  'passive.vampire': {
    id: 'passive.vampire',
    kind: 'passive',
    title: 'Vampire',
    displayHint: 'healing',
    passive: {
      trigger: 'onCast',
      target: 'vampirePercent',
      stacking: 'flat',
      paramKey: 'percent',
      defaultValue: 0,
    },
    describe: (params) => `Heal ${numberParam(params, 'percent')}% of damage dealt`,
  },
  'passive.reduceDamage': {
    id: 'passive.reduceDamage',
    kind: 'passive',
    title: 'Damage Reduction',
    displayHint: 'shield',
    passive: {
      trigger: 'onIncomingDamage',
      target: 'incomingDamage',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `Reduce incoming damage by ${numberParam(params, 'amount')}`,
  },
};

export function createEffectRef(effectId: CatalogEffectId, params?: EffectParams): EffectRef {
  return {
    effectId,
    ...(params ? { params: { ...params } } : {}),
  };
}

export function getEffectDescription(effectRef: RuneEffectRef): string {
  if (isRuneRemovalEffectRef(effectRef)) {
    const random = effectRef.selection === 'random' ? 'random ' : '';
    const type = effectRef.runeType ? `${effectRef.runeType} ` : '';
    let removalText: string;
    if (effectRef.effectId === 'rune.consume') {
      removalText = effectRef.targetOwner === 'self'
        ? `Consume a ${random}${type}rune`
        : `Consume your opponents ${random}${type}rune`;
    } else {
      const count = effectRef.count === 1 ? 'a' : String(effectRef.count);
      const plural = effectRef.count === 1 ? 'rune' : 'runes';
      removalText = `Destroy ${count} ${random}${type}${plural}${effectRef.targetOwner === 'self' ? ' on your wall' : ''}`;
    }
    const payloadText = effectRef.payload ? getEffectDescription(effectRef.payload) : '';
    if (!payloadText) return removalText;
    return `${removalText} to ${payloadText.charAt(0).toLowerCase()}${payloadText.slice(1)}`;
  }

  const catalogEntry = EFFECT_CATALOG[effectRef.effectId as CatalogEffectId];
  if (!catalogEntry) {
    return '';
  }
  return catalogEntry.describe(effectRef.params ?? {});
}

export function getEffectRefDescriptions(effectRefs: RuneEffectRef[] | null | undefined): string[] {
  if (!effectRefs) {
    return [];
  }
  return effectRefs.map(getEffectDescription).filter(Boolean);
}
