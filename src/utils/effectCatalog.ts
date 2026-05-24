/**
 * effectCatalog - central metadata and description helpers for effect refs.
 */

import type { EffectParams, EffectRef, EffectTrigger, RuneType } from '../types/game';

export type CastEffectId =
  | 'cast.damage'
  | 'cast.damageAdjacent'
  | 'cast.damageConditional'
  | 'cast.damageFragile'
  | 'cast.damageConsuming'
  | 'cast.destroyType'
  | 'cast.convertRandom'
  | 'cast.convertAdjacent'
  | 'cast.retriggerAdjacent'
  | 'cast.retriggerType'
  | 'cast.healing'
  | 'cast.healSynergy'
  | 'cast.armor'
  | 'cast.armorAdjacent'
  | 'cast.healthIncrease'
  | 'cast.healthDecrease'
  | 'cast.draw'
  | 'cast.drawAdjacent'
  | 'cast.returnAdjacent'
  | 'cast.arcaneDustAdjacent'
  | 'cast.chargeAdjacent'
  | 'cast.fortune'
  | 'cast.synergy'
  | 'cast.armorSynergy'
  | 'cast.fragile';

export type PassiveEffectId =
  | 'passive.ringDraftRarity'
  | 'passive.robeDraftSelection'
  | 'passive.rodHealing'
  | 'passive.potionArmor'
  | 'passive.tomeCastDamage'
  | 'passive.damageBoostSynergy'
  | 'passive.pulseSynergy'
  | 'passive.healingStartTurn'
  | 'passive.drawingStartTurn'
  | 'passive.addDamage'
  | 'passive.armorBoost'
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
    describe: (params) => `Deal ${numberParam(params, 'amount')} damage on cast`,
  },
  'cast.damageAdjacent': {
    id: 'cast.damageAdjacent',
    kind: 'cast',
    title: 'Adjacent Damage',
    displayHint: 'damage',
    describe: (params) => `Deal ${numberParam(params, 'amount')} damage for every adjacent completed rune, including this rune`,
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
  'cast.damageConsuming': {
    id: 'cast.damageConsuming',
    kind: 'cast',
    title: 'Consuming Damage',
    displayHint: 'damage',
    describe: (params) => `Deal ${numberParam(params, 'amount')} damage for every adjacent completed rune, then destroy them`,
  },
  'cast.destroyType': {
    id: 'cast.destroyType',
    kind: 'cast',
    title: 'Type Destroy',
    displayHint: 'damage',
    describe: (params) => `Destroy a random completed ${runeTypeParam(params, 'targetType')} rune`,
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
    describe: (params) => `Convert adjacent completed runes into common ${runeTypeParam(params, 'targetType')} runes with no effects`,
  },
  'cast.retriggerAdjacent': {
    id: 'cast.retriggerAdjacent',
    kind: 'cast',
    title: 'Adjacent Retrigger',
    displayHint: 'damage',
    describe: () => 'Retrigger adjacent completed runes',
  },
  'cast.retriggerType': {
    id: 'cast.retriggerType',
    kind: 'cast',
    title: 'Type Retrigger',
    displayHint: 'damage',
    describe: (params) => `Retrigger completed ${runeTypeParam(params, 'targetType')} runes`,
  },
  'cast.healing': {
    id: 'cast.healing',
    kind: 'cast',
    title: 'Healing',
    displayHint: 'healing',
    describe: (params) => `Heal ${numberParam(params, 'amount')} on cast`,
  },
  'cast.healSynergy': {
    id: 'cast.healSynergy',
    kind: 'cast',
    title: 'Healing Synergy',
    displayHint: 'healing',
    describe: (params) =>
      `Heal ${numberParam(params, 'amount')} for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall, including this rune if it matches`,
  },
  'cast.armor': {
    id: 'cast.armor',
    kind: 'cast',
    title: 'Armor',
    displayHint: 'armor',
    describe: (params) => `Gain ${numberParam(params, 'amount')} armor on cast`,
  },
  'cast.armorAdjacent': {
    id: 'cast.armorAdjacent',
    kind: 'cast',
    title: 'Adjacent Armor',
    displayHint: 'armor',
    describe: (params) => `Gain ${numberParam(params, 'amount')} armor for every adjacent completed rune, including this rune`,
  },
  'cast.healthIncrease': {
    id: 'cast.healthIncrease',
    kind: 'cast',
    title: 'Health Increase',
    displayHint: 'healing',
    describe: (params) => `Increase maximum health by ${numberParam(params, 'amount')} and heal ${numberParam(params, 'amount')}`,
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
    describe: (params) => `Draw ${numberParam(params, 'amount')} rune on cast`,
  },
  'cast.drawAdjacent': {
    id: 'cast.drawAdjacent',
    kind: 'cast',
    title: 'Adjacent Draw',
    displayHint: 'deck',
    describe: () => 'Draw one rune for every adjacent completed rune, including this rune',
  },
  'cast.returnAdjacent': {
    id: 'cast.returnAdjacent',
    kind: 'cast',
    title: 'Adjacent Return',
    displayHint: 'deck',
    describe: () => 'Return adjacent completed runes to your hand',
  },
  'cast.arcaneDustAdjacent': {
    id: 'cast.arcaneDustAdjacent',
    kind: 'cast',
    title: 'Adjacent Arcane Dust',
    displayHint: 'arcaneDust',
    describe: (params) => `Gain ${numberParam(params, 'amount')} arcane dust for every adjacent completed rune, including this rune`,
  },
  'cast.chargeAdjacent': {
    id: 'cast.chargeAdjacent',
    kind: 'cast',
    title: 'Adjacent Charge',
    displayHint: 'deck',
    describe: () => 'Charge adjacent incomplete rune slots by 1',
  },
  'cast.fortune': {
    id: 'cast.fortune',
    kind: 'cast',
    title: 'Fortune',
    displayHint: 'arcaneDust',
    describe: (params) => `Gain ${numberParam(params, 'amount')} arcane dust on cast`,
  },
  'cast.synergy': {
    id: 'cast.synergy',
    kind: 'cast',
    title: 'Synergy',
    displayHint: 'damage',
    describe: (params) =>
      `Deal ${numberParam(params, 'amount')} damage for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall, including this rune if it matches`,
  },
  'cast.armorSynergy': {
    id: 'cast.armorSynergy',
    kind: 'cast',
    title: 'Armor Synergy',
    displayHint: 'armor',
    describe: (params) =>
      `Gain ${numberParam(params, 'amount')} armor for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall, including this rune if it matches`,
  },
  'cast.fragile': {
    id: 'cast.fragile',
    kind: 'cast',
    title: 'Fragile',
    displayHint: 'damage',
    describe: (params) =>
      `Deal ${numberParam(params, 'amount')} damage if your completed wall has no ${runeTypeParam(params, 'fragileType')} runes`,
  },
  'passive.ringDraftRarity': {
    id: 'passive.ringDraftRarity',
    kind: 'passive',
    title: 'Draft Rarity',
    displayHint: 'deckDraft',
    passive: {
      trigger: 'onDeckDraftOffer',
      target: 'epicChance',
      stacking: 'multiplier',
      paramKey: 'epicChanceMultiplier',
      defaultValue: 1,
    },
    describe: () => 'Double the odds of drafting epic runes',
  },
  'passive.robeDraftSelection': {
    id: 'passive.robeDraftSelection',
    kind: 'passive',
    title: 'Draft Selection',
    displayHint: 'deckDraft',
    passive: {
      trigger: 'onDeckDraftOffer',
      target: 'selectionLimit',
      stacking: 'flat',
      paramKey: 'selectionBonus',
      defaultValue: 0,
    },
    describe: (params) => `Increase total picks by ${numberParam(params, 'selectionBonus', 1)} during deck drafting`,
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
  'passive.potionArmor': {
    id: 'passive.potionArmor',
    kind: 'passive',
    title: 'Armor Multiplier',
    displayHint: 'armor',
    passive: {
      trigger: 'onCast',
      target: 'armor',
      stacking: 'multiplier',
      paramKey: 'armorMultiplier',
      defaultValue: 1,
    },
    describe: () => 'Double all armor gained',
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
      `At end of turn, deal ${numberParam(params, 'amount')} damage for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall, including this rune if it matches`,
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
  'passive.armorBoost': {
    id: 'passive.armorBoost',
    kind: 'passive',
    title: 'Armor Boost',
    displayHint: 'armor',
    passive: {
      trigger: 'onCast',
      target: 'armor',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `Increase all armor gained by ${numberParam(params, 'amount')}`,
  },
  'passive.explosive': {
    id: 'passive.explosive',
    kind: 'passive',
    title: 'Explosive',
    displayHint: 'damage',
    passive: {
      trigger: 'onCast',
      target: 'explosiveDamage',
      stacking: 'flat',
      paramKey: 'amount',
      defaultValue: 0,
    },
    describe: (params) => `Deal ${numberParam(params, 'amount')} damage if destroyed or transformed`,
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
    displayHint: 'armor',
    passive: {
      trigger: 'onEnemyAttack',
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

export function getEffectDescription(effectRef: EffectRef): string {
  const catalogEntry = EFFECT_CATALOG[effectRef.effectId as CatalogEffectId];
  if (!catalogEntry) {
    return '';
  }
  return catalogEntry.describe(effectRef.params ?? {});
}

export function getEffectRefDescriptions(effectRefs: EffectRef[] | null | undefined): string[] {
  if (!effectRefs) {
    return [];
  }
  return effectRefs.map(getEffectDescription).filter(Boolean);
}
