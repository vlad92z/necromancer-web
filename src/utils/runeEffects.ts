import type { EffectRef, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createEffectRef, getEffectRefDescriptions } from './effectCatalog';
import { getRuneImageSources } from './runeImages';

type RuneTemplate = Omit<Rune, 'id' | 'cardImageSrc' | 'tokenImageSrc'> & {
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
      runeTypes: ['Fire'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'fire-uncommon-adjacent',
      runeTypes: ['Fire'],
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.damageAdjacent', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'fire-rare-fragile',
      runeTypes: ['Fire'],
      rarity: 'rare',
      castEffectRefs: [createEffectRef('cast.damageFragile', { amount: 20, reduction: 3, fragileType: 'Frost' })],
      passiveEffectRefs: [],
    }],
    epic: [{
      templateId: 'fire-epic-add-damage',
      runeTypes: ['Fire'],
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.addDamage', { amount: 10, runeType: 'Fire' })],
    }],
  },
  Frost: {
    common: [{
      templateId: 'frost-common-armor',
      runeTypes: ['Frost'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.armor', { amount: 3 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'frost-uncommon-adjacent',
      runeTypes: ['Frost'],
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.armorAdjacent', { amount: 3 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'frost-rare-synergy',
      runeTypes: ['Frost'],
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorEndTurnSynergy', { amount: 3, synergyType: 'Frost' })],
    }],
    epic: [{
      templateId: 'frost-epic-armor-boost',
      runeTypes: ['Frost'],
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorBoost', { amount: 20 })],
    }],
  },
  Life: {
    common: [{
      templateId: 'life-common-healing',
      runeTypes: ['Life'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.healing', { amount: 2 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'life-uncommon-health-increase',
      runeTypes: ['Life'],
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.healthIncrease', { amount: 4 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'life-rare-healing-start-turn',
      runeTypes: ['Life'],
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.healingStartTurnSynergy', { amount: 4, synergyType: 'Life' })],
    }],
    epic: [{
      templateId: 'life-epic-heal-synergy',
      runeTypes: ['Life'],
      rarity: 'epic',
      castEffectRefs: [createEffectRef('cast.healSynergy', { amount: 30, synergyType: 'Life' })],
      passiveEffectRefs: [],
    }],
  },
  Void: {
    common: [{
      templateId: 'void-common-damage',
      runeTypes: ['Void'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'void-uncommon-consuming',
      runeTypes: ['Void'],
      rarity: 'uncommon',
      castEffectRefs: [createEffectRef('cast.damageConsuming', { amount: 2 })],
      passiveEffectRefs: [],
    }],
    rare: [{
      templateId: 'void-rare-pulse-synergy',
      runeTypes: ['Void'],
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.pulseSynergy', { amount: 1, synergyType: 'Void' })],
    }],
    epic: [{
      templateId: 'void-epic-vampire',
      runeTypes: ['Void'],
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.vampire', { percent: 50 })],
    }],
  },
  Wind: {
    common: [{
      templateId: 'wind-common-draw',
      runeTypes: ['Wind'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.draw', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'wind-uncommon-draw-adjacent',
      runeTypes: ['Wind'],
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.drawingStartTurn', { amount: 1 })],
    }],
    rare: [{
      templateId: 'wind-rare-drawing-start-turn',
      runeTypes: ['Wind'],
      rarity: 'rare',
      castEffectRefs: [createEffectRef('cast.drawAdjacent')],
      passiveEffectRefs: [],
    }],
    epic: [{
      templateId: 'wind-epic-return-adjacent',
      runeTypes: ['Wind'],
      rarity: 'epic',
      castEffectRefs: [createEffectRef('cast.returnAdjacent')],
      passiveEffectRefs: [],
    }],
  },
  Lightning: {
    common: [{
      templateId: 'lightning-common-damage',
      runeTypes: ['Lightning'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    }],
    uncommon: [{
      templateId: 'lightning-uncommon-damage-boost',
      runeTypes: ['Lightning'],
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.adjacentDamageBoost', { amount: 2 })],
    }],
    rare: [{
      templateId: 'lightning-rare-explosive',
      runeTypes: ['Lightning'],
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.explosive', { amount: 30 })],
    }],
    epic: [{
      templateId: 'lightning-epic-retrigger-adjacent',
      runeTypes: ['Lightning'],
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
    runeTypes: [...template.runeTypes],
    rarity: template.rarity,
    ...getRuneImageSources(runeType, template.rarity),
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
