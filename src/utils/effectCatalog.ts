/**
 * effectCatalog - central metadata and description helpers for effect refs.
 */

import type { EffectParams, EffectRef, RuneType } from '../types/game';

export type CastEffectId =
  | 'cast.damage'
  | 'cast.healing'
  | 'cast.armor'
  | 'cast.fortune'
  | 'cast.synergy'
  | 'cast.armorSynergy'
  | 'cast.fragile'
  | 'cast.channel'
  | 'cast.channelSynergy';

export type PassiveEffectId =
  | 'passive.ringDraftRarity'
  | 'passive.robeDraftSelection'
  | 'passive.rodHealing'
  | 'passive.potionArmor'
  | 'passive.tomeCastDamage';

export type CatalogEffectId = CastEffectId | PassiveEffectId;

export interface EffectCatalogEntry {
  id: CatalogEffectId;
  kind: 'cast' | 'passive';
  title: string;
  displayHint: string;
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
  'cast.healing': {
    id: 'cast.healing',
    kind: 'cast',
    title: 'Healing',
    displayHint: 'healing',
    describe: (params) => `Heal ${numberParam(params, 'amount')} on cast`,
  },
  'cast.armor': {
    id: 'cast.armor',
    kind: 'cast',
    title: 'Armor',
    displayHint: 'armor',
    describe: (params) => `Gain ${numberParam(params, 'amount')} armor on cast`,
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
      `Deal ${numberParam(params, 'amount')} damage for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'cast.armorSynergy': {
    id: 'cast.armorSynergy',
    kind: 'cast',
    title: 'Armor Synergy',
    displayHint: 'armor',
    describe: (params) =>
      `Gain ${numberParam(params, 'amount')} armor for every ${runeTypeParam(params, 'synergyType')} rune in your completed wall`,
  },
  'cast.fragile': {
    id: 'cast.fragile',
    kind: 'cast',
    title: 'Fragile',
    displayHint: 'damage',
    describe: (params) =>
      `Deal ${numberParam(params, 'amount')} damage if your completed wall has no ${runeTypeParam(params, 'fragileType')} runes`,
  },
  'cast.channel': {
    id: 'cast.channel',
    kind: 'cast',
    title: 'Channel',
    displayHint: 'channel',
    describe: () => 'No combat effect yet',
  },
  'cast.channelSynergy': {
    id: 'cast.channelSynergy',
    kind: 'cast',
    title: 'Channel Synergy',
    displayHint: 'channel',
    describe: () => 'No combat effect yet',
  },
  'passive.ringDraftRarity': {
    id: 'passive.ringDraftRarity',
    kind: 'passive',
    title: 'Draft Rarity',
    displayHint: 'deckDraft',
    describe: () => 'Double the odds of drafting epic runes',
  },
  'passive.robeDraftSelection': {
    id: 'passive.robeDraftSelection',
    kind: 'passive',
    title: 'Draft Selection',
    displayHint: 'deckDraft',
    describe: (params) => `Increase total picks by ${numberParam(params, 'selectionBonus', 1)} during deck drafting`,
  },
  'passive.rodHealing': {
    id: 'passive.rodHealing',
    kind: 'passive',
    title: 'Healing Multiplier',
    displayHint: 'healing',
    describe: () => 'Double all healing',
  },
  'passive.potionArmor': {
    id: 'passive.potionArmor',
    kind: 'passive',
    title: 'Armor Multiplier',
    displayHint: 'armor',
    describe: () => 'Double all armor gained',
  },
  'passive.tomeCastDamage': {
    id: 'passive.tomeCastDamage',
    kind: 'passive',
    title: 'Cast Damage',
    displayHint: 'damage',
    describe: (params) => `+${numberParam(params, 'damageBonus', 1)} damage on all casts`,
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
