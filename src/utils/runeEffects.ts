import type { Rune, RuneEffectRarity, RuneEffectRef, RuneType } from '../types/game';
import { CARD_DEFINITIONS, type CardDefinition, type CardName } from './cardCatalog';
import { getEffectRefDescriptions } from './effectCatalog';
import { copyRuneEffectRef } from './runeRemoval';

type RuneTemplate = CardDefinition;

interface CreateRuneFromPoolInput {
  id: string;
  runeType: RuneType;
  rarity?: RuneEffectRarity;
  random?: () => number;
}

export function copyEffectRefs(effectRefs: RuneEffectRef[] | null | undefined): RuneEffectRef[] {
  return effectRefs?.map(copyRuneEffectRef) ?? [];
}

/** Compatibility index for type/rarity game rules; card data lives in cardCatalog.ts. */
export const PREDEFINED_RUNE_VARIANTS: Record<RuneType, Record<RuneEffectRarity, RuneTemplate[]>> = {
  Fire: { common: [], uncommon: [], rare: [], epic: [] },
  Frost: { common: [], uncommon: [], rare: [], epic: [] },
  Life: { common: [], uncommon: [], rare: [], epic: [] },
  Void: { common: [], uncommon: [], rare: [], epic: [] },
  Wind: { common: [], uncommon: [], rare: [], epic: [] },
  Lightning: { common: [], uncommon: [], rare: [], epic: [] },
};

export function createRuneFromCardName({ id, cardName }: { id: string; cardName: CardName }): Rune {
  const card = CARD_DEFINITIONS[cardName];
  return {
    id,
    name: card.name,
    runeTypes: [...card.runeTypes],
    rarity: card.rarity,
    cardImageSrc: card.cardImageSrc,
    tokenImageSrc: card.tokenImageSrc,
    spellAnimation: card.spellAnimation,
    manaCost: card.manaCost,
    castEffectRefs: copyEffectRefs(card.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(card.passiveEffectRefs),
  };
}

export function getDefaultRuneName(runeType: RuneType, rarity: RuneEffectRarity = 'common'): string {
  const template = PREDEFINED_RUNE_VARIANTS[runeType][rarity][0];
  if (!template) throw new Error(`No predefined rune variants for ${rarity} ${runeType}`);
  return template.name;
}

export function createRuneFromPool({ id, runeType, rarity = 'common', random = Math.random }: CreateRuneFromPoolInput): Rune {
  const variants = PREDEFINED_RUNE_VARIANTS[runeType][rarity];
  if (variants.length === 0) throw new Error(`No predefined rune variants for ${rarity} ${runeType}`);
  return createRuneFromCardName({ id, cardName: variants[Math.floor(random() * variants.length)].name as CardName });
}

export function getRuneEffectDescription(rune: Rune | null | undefined): string {
  if (!rune) return '';
  return [...getEffectRefDescriptions(rune.castEffectRefs), ...getEffectRefDescriptions(rune.passiveEffectRefs)]
    .map((line) => `• ${line}`)
    .join('\n\n');
}
