import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createEffectRef, getEffectRefDescriptions } from './effectCatalog';
import {
  BARRICADE_RUNE_IMAGE_SOURCES,
  CURRENT_RUNE_IMAGE_SOURCES,
  HEADWIND_RUNE_IMAGE_SOURCES,
} from './runeImages';

type RuneTemplate = Omit<Rune, 'id'> & {
  templateId: string;
};

interface CreateRuneFromPoolInput {
  id: string;
  runeType: RuneType;
  rarity?: RuneEffectRarity;
  random?: () => number;
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

export const PREDEFINED_RUNE_VARIANTS: Record<RuneType, Record<RuneEffectRarity, RuneTemplate[]>> = {
  Fire: {
    common: [{
      templateId: 'fire-common-spark',
      name: 'Firebolt',
      runeTypes: ['Fire'],
      rarity: 'common',
      ...CURRENT_RUNE_IMAGE_SOURCES.Fire,
      castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'fire-uncommon-adjacent',
      name: 'Fire Blast',
      runeTypes: ['Fire'],
      rarity: 'uncommon',
      ...CURRENT_RUNE_IMAGE_SOURCES.Fire,
      castEffectRefs: [createEffectRef('cast.damageAdjacent', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'fire-rare-fragile',
      name: 'Pyroblast',
      runeTypes: ['Fire'],
      rarity: 'rare',
      ...CURRENT_RUNE_IMAGE_SOURCES.Fire,
      castEffectRefs: [createEffectRef('cast.damageFragile', { amount: 20, reduction: 3, fragileType: 'Frost' })],
      passiveEffectRefs: [],
    }],
    epic: [{
      templateId: 'fire-epic-add-damage',
      name: 'Burn',
      runeTypes: ['Fire'],
      rarity: 'epic',
      ...CURRENT_RUNE_IMAGE_SOURCES.Fire,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.addDamage', { amount: 10, runeType: 'Fire' })],
    }],
  },
  Frost: {
    common: [{
      templateId: 'frost-common-armor',
      name: 'Frost Shield',
      runeTypes: ['Frost'],
      rarity: 'common',
      ...CURRENT_RUNE_IMAGE_SOURCES.Frost,
      castEffectRefs: [createEffectRef('cast.armor', { amount: 5 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'frost-uncommon-adjacent',
      name: 'Ice Block',
      runeTypes: ['Frost'],
      rarity: 'uncommon',
      ...CURRENT_RUNE_IMAGE_SOURCES.Frost,
      castEffectRefs: [createEffectRef('cast.armorAdjacent', { amount: 3 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'frost-rare-synergy',
      name: 'Freezing Cold',
      runeTypes: ['Frost'],
      rarity: 'rare',
      ...CURRENT_RUNE_IMAGE_SOURCES.Frost,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorEndTurnSynergy', { amount: 3, synergyType: 'Frost' })],
    }],
    epic: [{
      templateId: 'frost-epic-armor-boost',
      name: 'Icy Veins',
      runeTypes: ['Frost'],
      rarity: 'epic',
      ...CURRENT_RUNE_IMAGE_SOURCES.Frost,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorBoost', { amount: 20 })],
    }],
  },
  Life: {
    common: [{
      templateId: 'life-common-healing',
      name: 'Barricade',
      runeTypes: ['Life'],
      rarity: 'common',
      ...BARRICADE_RUNE_IMAGE_SOURCES,
      castEffectRefs: [createEffectRef('cast.armor', { amount: 5 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'life-uncommon-health-increase',
      name: 'Lifeline',
      runeTypes: ['Life'],
      rarity: 'uncommon',
      ...CURRENT_RUNE_IMAGE_SOURCES.Life,
      castEffectRefs: [createEffectRef('cast.healthIncrease', { amount: 4 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'life-rare-healing-start-turn',
      name: 'Healing Rain',
      runeTypes: ['Life'],
      rarity: 'rare',
      ...CURRENT_RUNE_IMAGE_SOURCES.Life,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.healingStartTurnSynergy', { amount: 4, synergyType: 'Life' })],
    }],
    epic: [{
      templateId: 'life-epic-heal-synergy',
      name: 'Immortality',
      runeTypes: ['Life'],
      rarity: 'epic',
      ...CURRENT_RUNE_IMAGE_SOURCES.Life,
      castEffectRefs: [createEffectRef('cast.healSynergy', { amount: 30, synergyType: 'Life' })],
      passiveEffectRefs: [],
    }],
  },
  Void: {
    common: [{
      templateId: 'void-common-damage',
      name: 'Void Tendrils',
      runeTypes: ['Void'],
      rarity: 'common',
      ...CURRENT_RUNE_IMAGE_SOURCES.Void,
      castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'void-uncommon-consuming',
      name: 'Void Blast',
      runeTypes: ['Void'],
      rarity: 'uncommon',
      ...CURRENT_RUNE_IMAGE_SOURCES.Void,
      castEffectRefs: [createEffectRef('cast.damageConsuming', { amount: 2 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'void-rare-pulse-synergy',
      name: 'Void Pulse',
      runeTypes: ['Void'],
      rarity: 'rare',
      ...CURRENT_RUNE_IMAGE_SOURCES.Void,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.pulseSynergy', { amount: 1, synergyType: 'Void' })],
    }],
    epic: [{
      templateId: 'void-epic-vampire',
      name: 'Void 4',
      runeTypes: ['Void'],
      rarity: 'epic',
      ...CURRENT_RUNE_IMAGE_SOURCES.Void,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.vampire', { percent: 50 })],
    }],
  },
  Wind: {
    common: [{
      templateId: 'wind-common-draw',
      name: 'Tornado',
      runeTypes: ['Wind'],
      rarity: 'common',
      ...CURRENT_RUNE_IMAGE_SOURCES.Wind,
      castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'wind-uncommon-draw-adjacent',
      name: 'Headwind',
      runeTypes: ['Wind'],
      rarity: 'uncommon',
      ...HEADWIND_RUNE_IMAGE_SOURCES,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.reduceDamage', { amount: 1 })],
    }],
    rare: [{
      templateId: 'wind-rare-drawing-start-turn',
      name: 'Tailwind',
      runeTypes: ['Wind'],
      rarity: 'rare',
      ...CURRENT_RUNE_IMAGE_SOURCES.Wind,
      castEffectRefs: [createEffectRef('cast.drawAdjacent')],
      passiveEffectRefs: [],
    }],
    epic: [{
      templateId: 'wind-epic-return-adjacent',
      name: 'Perfect Storm',
      runeTypes: ['Wind'],
      rarity: 'epic',
      ...CURRENT_RUNE_IMAGE_SOURCES.Wind,
      castEffectRefs: [createEffectRef('cast.returnAdjacent')],
      passiveEffectRefs: [],
    }],
  },
  Lightning: {
    common: [{
      templateId: 'lightning-common-damage',
      name: 'Lightning Bolt',
      runeTypes: ['Lightning'],
      rarity: 'common',
      ...CURRENT_RUNE_IMAGE_SOURCES.Lightning,
      castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'lightning-uncommon-damage-boost',
      name: 'Chain Lightning',
      runeTypes: ['Lightning'],
      rarity: 'uncommon',
      ...CURRENT_RUNE_IMAGE_SOURCES.Lightning,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.adjacentDamageBoost', { amount: 2 })],
    }],
    rare: [{
      templateId: 'lightning-rare-explosive',
      name: 'Electric Surge',
      runeTypes: ['Lightning'],
      rarity: 'rare',
      ...CURRENT_RUNE_IMAGE_SOURCES.Lightning,
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.explosive', { amount: 30 })],
    }],
    epic: [{
      templateId: 'lightning-epic-retrigger-adjacent',
      name: 'Perfect Synergy',
      runeTypes: ['Lightning'],
      rarity: 'epic',
      ...CURRENT_RUNE_IMAGE_SOURCES.Lightning,
      castEffectRefs: [createEffectRef('cast.retriggerAdjacent')],
      passiveEffectRefs: [],
    }],
  },
};

export function getDefaultRuneName(
  runeType: RuneType,
  rarity: RuneEffectRarity = 'common',
): string {
  const template = PREDEFINED_RUNE_VARIANTS[runeType][rarity][0];
  if (!template) {
    throw new Error(`No predefined rune variants for ${rarity} ${runeType}`);
  }
  return template.name;
}

export function createRuneFromPool({
  id,
  runeType,
  rarity = 'common',
  random = Math.random,
}: CreateRuneFromPoolInput): Rune {
  const variants = PREDEFINED_RUNE_VARIANTS[runeType][rarity];
  if (variants.length === 0) {
    throw new Error(`No predefined rune variants for ${rarity} ${runeType}`);
  }

  const template = variants[Math.floor(random() * variants.length)];
  return {
    id,
    name: template.name,
    runeTypes: [...template.runeTypes],
    rarity: template.rarity,
    cardImageSrc: template.cardImageSrc,
    tokenImageSrc: template.tokenImageSrc,
    castEffectRefs: copyEffectRefs(template.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(template.passiveEffectRefs),
  };
}

export function getRuneEffectDescription(
  rune: Rune | null | undefined,
): string {
  if (!rune) {
    return '';
  }

  const effectLines = [
    ...getEffectRefDescriptions(rune.castEffectRefs),
    ...getEffectRefDescriptions(rune.passiveEffectRefs),
  ];
  return effectLines.map((line) => `• ${line}`).join('\n\n');
}
