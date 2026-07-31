/** Post-victory, enemy-specific single-rune reward helpers. */

import type { DeckDraftOffer, DeckDraftState, Enemy, Rune } from '../types/game';
import { CARD_DEFINITIONS, type CardName } from './cardCatalog';
import { getMonsterDefinition } from './monsterCatalog';
import { createRuneFromCardName } from './runeEffects';

function randomUniqueTemplates(templates: readonly CardName[], count: number, random: () => number): CardName[] {
  const pool = [...templates];
  const selected: CardName[] = [];
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
  const templates = enemy ? getMonsterDefinition(enemy.id)?.rewardCardNames ?? [] : [];
  const offers = randomUniqueTemplates(templates, 3, random).map((template, index) => ({
    id: `${ownerId}-reward-${CARD_DEFINITIONS[template].templateId}-${index}`,
    ownerId,
    rune: createRuneFromCardName({ id: `${ownerId}-reward-rune-${CARD_DEFINITIONS[template].templateId}-${index}`, cardName: template }),
  }));

  return { offers, selectedOffer: null, arcaneDustReward };
}

export function mergeDeckWithOffer(deck: Rune[], selectedOffer: DeckDraftOffer): Rune[] {
  return [...deck, selectedOffer.rune];
}
