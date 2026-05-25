/**
 * Deck drafting utilities for post-victory rune packs.
 */

import type { DeckDraftOffer, DeckDraftState, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createRuneFromPool } from './runeEffects';
import { getRuneTypes } from './gameInitialization';

const BASE_EPIC_CHANCE = 0;
const BASE_RARE_CHANCE = 0;
const BASE_UNCOMMON_CHANCE = 10;
const EPIC_INCREMENT_PER_WIN = 1;
const RARE_INCREMENT_PER_WIN = 5;
const UNCOMMON_INCREMENT_PER_WIN = 3;
const RUNES_PER_PACK = 3;

const RARITY_VALUE: Record<RuneEffectRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
};

interface RollDraftRarityInput {
  winStreak: number;
  random?: () => number;
}

interface CreateDraftRuneForRarityInput {
  ownerId: string;
  index: number;
  rarity: RuneEffectRarity;
  runeType: RuneType;
  random?: () => number;
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getPackDisplayRarity(runes: Rune[]): RuneEffectRarity {
  return runes.reduce<RuneEffectRarity>((best, rune) => (
    RARITY_VALUE[rune.rarity] > RARITY_VALUE[best] ? rune.rarity : best
  ), 'common');
}

export function rollDraftRarity({
  winStreak,
  random = Math.random,
}: RollDraftRarityInput): RuneEffectRarity {
  const safeWinStreak = Math.max(0, winStreak);
  const epicChance = clampPercentage(BASE_EPIC_CHANCE + safeWinStreak * EPIC_INCREMENT_PER_WIN);
  const rareChance = clampPercentage(Math.min(
    BASE_RARE_CHANCE + safeWinStreak * RARE_INCREMENT_PER_WIN,
    100 - epicChance
  ));
  const uncommonChance = clampPercentage(Math.min(
    BASE_UNCOMMON_CHANCE + safeWinStreak * UNCOMMON_INCREMENT_PER_WIN,
    100 - epicChance - rareChance
  ));
  const roll = random() * 100;

  if (roll < epicChance) return 'epic';
  if (roll < epicChance + rareChance) return 'rare';
  if (roll < epicChance + rareChance + uncommonChance) return 'uncommon';
  return 'common';
}

export function createDraftRuneForRarity({
  ownerId,
  index,
  rarity,
  runeType,
  random = Math.random,
}: CreateDraftRuneForRarityInput): Rune {
  const id = `draft-${ownerId}-${runeType}-${index}-${random().toString(36).slice(2, 6)}`;
  return createRuneFromPool({ id, runeType, rarity, random });
}

function createDraftPack(
  ownerId: string,
  runeType: RuneType,
  offerIndex: number,
  winStreak: number = 0,
  random: () => number = Math.random
): DeckDraftOffer {
  const runes = Array.from({ length: RUNES_PER_PACK }, (_, runeIndex) => {
    const rarity = rollDraftRarity({ winStreak: winStreak - 1, random });
    return createDraftRuneForRarity({
      ownerId,
      index: offerIndex * RUNES_PER_PACK + runeIndex,
      rarity,
      runeType,
      random,
    });
  });

  if (runes.every((rune) => rune.rarity === 'common')) {
    runes[0] = createDraftRuneForRarity({
      ownerId,
      index: offerIndex * RUNES_PER_PACK,
      rarity: 'uncommon',
      runeType,
      random,
    });
  }

  return {
    id: `${ownerId}-draft-pack-${runeType}`,
    ownerId,
    runeType,
    displayRarity: getPackDisplayRarity(runes),
    runes,
  };
}

function createDraftOffers(
  ownerId: string,
  winStreak: number = 0,
  random: () => number = Math.random
): DeckDraftOffer[] {
  return getRuneTypes().map((runeType, offerIndex) => createDraftPack(
    ownerId,
    runeType,
    offerIndex,
    winStreak,
    random
  ));
}

export function createDeckDraftState(
  ownerId: string,
  winStreak: number = 0,
  random: () => number = Math.random
): DeckDraftState {
  return {
    offers: createDraftOffers(ownerId, winStreak, random),
    picksRemaining: 1,
    totalPicks: 1,
    selectedOffer: null,
  };
}

export function mergeDeckWithOffer(deck: Rune[], selectedOffer: DeckDraftOffer): Rune[] {
  return [...deck, ...selectedOffer.runes];
}
