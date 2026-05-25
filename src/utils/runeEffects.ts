import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createEffectRef, getEffectRefDescriptions } from './effectCatalog';

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
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'fire-uncommon-adjacent',
      runeType: 'Fire',
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.damageAdjacent', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'fire-rare-fragile',
      runeType: 'Fire',
      rarity: 'rare',
      castEffectRefs: [createEffectRef('cast.damageFragile', { amount: 25, reduction: 5, fragileType: 'Frost' })],
      passiveEffectRefs: [],
    }],
    epic: [{
      templateId: 'fire-epic-add-damage',
      runeType: 'Fire',
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.addDamage', { amount: 5, runeType: 'Fire' })],
    }],
  },
  Frost: {
    common: [{
      templateId: 'frost-common-armor',
      runeType: 'Frost',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.armor', { amount: 3 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'frost-uncommon-adjacent',
      runeType: 'Frost',
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.armorAdjacent', { amount: 3 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'frost-rare-synergy',
      runeType: 'Frost',
      rarity: 'rare',
      castEffectRefs: [createEffectRef('cast.armorSynergy', { amount: 5, synergyType: 'Frost' })],
      passiveEffectRefs: [],
    }],
    epic: [{
      templateId: 'frost-epic-armor-boost',
      runeType: 'Frost',
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorBoost', { amount: 5 })],
    }],
  },
  Life: {
    common: [{
      templateId: 'life-common-healing',
      runeType: 'Life',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.healing', { amount: 2 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'life-uncommon-health-increase',
      runeType: 'Life',
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.healthIncrease', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'life-rare-healing-start-turn',
      runeType: 'Life',
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.healingStartTurn', { amount: 2 })],
    }],
    epic: [{
      templateId: 'life-epic-heal-synergy',
      runeType: 'Life',
      rarity: 'epic',
      castEffectRefs: [createEffectRef('cast.healSynergy', { amount: 3, synergyType: 'Life' })],
      passiveEffectRefs: [],
    }],
  },
  Void: {
    common: [{
      templateId: 'void-common-damage',
      runeType: 'Void',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'void-uncommon-pulse-synergy',
      runeType: 'Void',
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.pulseSynergy', { amount: 2, synergyType: 'Void' })],
    }],
    rare: [{
      templateId: 'void-rare-consuming',
      runeType: 'Void',
      rarity: 'rare',
      castEffectRefs: [createEffectRef('cast.damageConsuming', { amount: 10 })],
      passiveEffectRefs: [],
    }],
    epic: [{
      templateId: 'void-epic-vampire',
      runeType: 'Void',
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.vampire', { percent: 25 })],
    }],
  },
  Wind: {
    common: [{
      templateId: 'wind-common-draw',
      runeType: 'Wind',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.draw', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'wind-uncommon-draw-adjacent',
      runeType: 'Wind',
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.drawAdjacent')],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'wind-rare-drawing-start-turn',
      runeType: 'Wind',
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.drawingStartTurn', { amount: 1 })],
    }],
    epic: [{
      templateId: 'wind-epic-return-adjacent',
      runeType: 'Wind',
      rarity: 'epic',
      castEffectRefs: [createEffectRef('cast.returnAdjacent')],
      passiveEffectRefs: [],
    }],
  },
  Lightning: {
    common: [{
      templateId: 'lightning-common-damage',
      runeType: 'Lightning',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'lightning-uncommon-damage-boost',
      runeType: 'Lightning',
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.damageBoost', { amount: 1 })],
    }],
    rare: [{
      templateId: 'lightning-rare-explosive',
      runeType: 'Lightning',
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.explosive', { amount: 30 })],
    }],
    epic: [{
      templateId: 'lightning-epic-retrigger-adjacent',
      runeType: 'Lightning',
      rarity: 'epic',
      castEffectRefs: [createEffectRef('cast.retriggerAdjacent')],
      passiveEffectRefs: [],
    }],
  },
};

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
    runeType: template.runeType,
    rarity: template.rarity,
    castEffectRefs: copyEffectRefs(template.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(template.passiveEffectRefs),
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
