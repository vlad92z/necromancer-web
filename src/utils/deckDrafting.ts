/** Post-victory, enemy-specific single-rune reward helpers. */

import type { DeckDraftOffer, DeckDraftState, Enemy, Rune } from '../types/game';
import { createEffectRef } from './effectCatalog';
import {
  CURRENT_RUNE_IMAGE_SOURCES,
  HIDE_RUNE_IMAGE_SOURCES,
  SCORCH_IMAGE_SOURCES,
  THROW_ROCK_RUNE_IMAGE_SOURCES,
} from './runeImages';

type RewardRuneTemplate = Omit<Rune, 'id'> & { templateId: string };

const GOBLIN_REWARD_RUNES: RewardRuneTemplate[] = [
  {
    templateId: 'goblin-throw-rock',
    name: 'Throw Rock',
    runeTypes: ['Life'],
    rarity: 'common',
    ...THROW_ROCK_RUNE_IMAGE_SOURCES,
    manaCost: 1,
    castEffectRefs: [createEffectRef('cast.damage', { amount: 3 })],
    passiveEffectRefs: [],
  },
  {
    templateId: 'goblin-hide',
    name: 'Hide',
    runeTypes: ['Life'],
    rarity: 'common',
    ...HIDE_RUNE_IMAGE_SOURCES,
    manaCost: 1,
    castEffectRefs: [createEffectRef('cast.armor', { amount: 3 })],
    passiveEffectRefs: [],
  },
  {
    templateId: 'goblin-scorch',
    name: 'Scorch',
    runeTypes: ['Fire'],
    rarity: 'common',
    ...SCORCH_IMAGE_SOURCES,
    manaCost: 3,
    castEffectRefs: [],
    passiveEffectRefs: [createEffectRef('passive.damageEndTurn', { amount: 3 })],
  },
  {
    templateId: 'goblin-lifeline',
    name: 'Lifeline',
    runeTypes: ['Life'],
    rarity: 'uncommon',
    ...CURRENT_RUNE_IMAGE_SOURCES.Life,
    manaCost: 5,
    castEffectRefs: [createEffectRef('cast.healthIncrease', { amount: 5 })],
    passiveEffectRefs: [],
  },
];

function copyRune(template: RewardRuneTemplate, id: string): Rune {
  return {
    ...template,
    id,
    runeTypes: [...template.runeTypes],
    castEffectRefs: template.castEffectRefs.map((effectRef) => ({
      ...effectRef,
      ...(effectRef.params ? { params: { ...effectRef.params } } : {}),
    })),
    passiveEffectRefs: template.passiveEffectRefs.map((effectRef) => ({
      ...effectRef,
      ...(effectRef.params ? { params: { ...effectRef.params } } : {}),
    })),
  };
}

function randomUniqueTemplates(templates: RewardRuneTemplate[], count: number, random: () => number): RewardRuneTemplate[] {
  const pool = [...templates];
  const selected: RewardRuneTemplate[] = [];
  while (pool.length > 0 && selected.length < count) {
    selected.push(pool.splice(Math.floor(random() * pool.length), 1)[0]!);
  }
  return selected;
}

export function createDeckDraftState(
  ownerId: string,
  enemy: Enemy | null,
  random: () => number = Math.random,
  arcaneDustReward: number = 0,
): DeckDraftState {
  const templates = enemy?.rewardRunePoolId === 'goblin' || enemy?.id === 'goblin'
    ? GOBLIN_REWARD_RUNES
    : [];
  const offers = randomUniqueTemplates(templates, 3, random).map((template, index) => ({
    id: `${ownerId}-reward-${template.templateId}-${index}`,
    ownerId,
    rune: copyRune(template, `${ownerId}-reward-rune-${template.templateId}-${index}`),
  }));

  return { offers, selectedOffer: null, arcaneDustReward };
}

export function mergeDeckWithOffer(deck: Rune[], selectedOffer: DeckDraftOffer): Rune[] {
  return [...deck, selectedOffer.rune];
}
