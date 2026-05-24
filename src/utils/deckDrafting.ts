/**
 * Deck drafting utilities for post-victory rewards.
 */

import type { ArtefactId } from '../types/artefacts';
import type { DeckDraftEffect, DeckDraftOffer, DeckDraftState, Player, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { createRune } from './runeEffects';
import { getRuneTypes } from './gameInitialization';
import { resolvePassiveEffects } from './effectResolver';

const BASE_EPIC_CHANCE = 0;
const BASE_RARE_CHANCE = 0;
const EPIC_INCREMENT_PER_WIN = 1;
const RARE_INCREMENT_PER_WIN = 5;

const DECK_DRAFT_EFFECTS: DeckDraftEffect[] = [
  { type: 'heal', amount: 50 },
  { type: 'maxHealth', amount: 25 },
  { type: 'betterRunes', rarityStep: 1 },
];

const RARITY_SEQUENCE: RuneEffectRarity[] = ['common', 'uncommon', 'rare', 'epic'];
const DEFAULT_DECK_DRAFT_SELECTION_LIMIT = 1;
const MAX_DECK_DRAFT_SELECTION_LIMIT = 3;

interface DeckDraftOfferValues {
  epicChance: number;
  rareChance: number;
  selectionLimit: number;
}

interface RollDraftRarityInput {
  winStreak: number;
  activeArtefacts?: ArtefactId[];
  random?: () => number;
}

interface CreateDraftRuneForRarityInput {
  ownerId: string;
  index: number;
  rarity: RuneEffectRarity;
  runeTypes?: RuneType[];
  random?: () => number;
}

function getDeckDraftEffectForIndex(index: number): DeckDraftEffect {
  return DECK_DRAFT_EFFECTS[index % DECK_DRAFT_EFFECTS.length];
}

function boostRarity(rarity: RuneEffectRarity, steps: number = 1): RuneEffectRarity {
  const currentIndex = RARITY_SEQUENCE.indexOf(rarity);
  if (currentIndex === -1) {
    return rarity;
  }
  return RARITY_SEQUENCE[Math.min(RARITY_SEQUENCE.length - 1, currentIndex + steps)];
}

function clampPercentage(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function resolveDeckDraftOfferPassives(
  activeArtefacts: ArtefactId[],
  baseValues: DeckDraftOfferValues
): DeckDraftOfferValues {
  const passiveResult = resolvePassiveEffects({
    trigger: 'onDeckDraftOffer',
    wall: [],
    activeArtefacts,
    baseValues: { ...baseValues },
  });

  const epicChance = clampPercentage(passiveResult.values.epicChance ?? baseValues.epicChance);
  const rareChance = clampPercentage(Math.min(
    passiveResult.values.rareChance ?? baseValues.rareChance,
    100 - epicChance
  ));
  const selectionLimit = Math.min(
    MAX_DECK_DRAFT_SELECTION_LIMIT,
    Math.max(1, passiveResult.values.selectionLimit ?? baseValues.selectionLimit)
  );

  return { epicChance, rareChance, selectionLimit };
}

export function getDeckDraftSelectionLimit(activeArtefacts: ArtefactId[]): number {
  return resolveDeckDraftOfferPassives(activeArtefacts, {
    epicChance: 0,
    rareChance: 0,
    selectionLimit: DEFAULT_DECK_DRAFT_SELECTION_LIMIT,
  }).selectionLimit;
}

export function rollDraftRarity({
  winStreak,
  activeArtefacts = [],
  random = Math.random,
}: RollDraftRarityInput): RuneEffectRarity {
  const baseEpicChance = Math.min(100, BASE_EPIC_CHANCE + winStreak * EPIC_INCREMENT_PER_WIN);
  const baseRareChance = Math.min(100 - baseEpicChance, BASE_RARE_CHANCE + winStreak * RARE_INCREMENT_PER_WIN);
  const { epicChance, rareChance } = resolveDeckDraftOfferPassives(activeArtefacts, {
    epicChance: baseEpicChance,
    rareChance: baseRareChance,
    selectionLimit: DEFAULT_DECK_DRAFT_SELECTION_LIMIT,
  });
  const roll = random() * 100;

  if (roll < epicChance) return 'epic';
  if (roll < epicChance + rareChance) return 'rare';
  return 'uncommon';
}

export function createDraftRuneForRarity({
  ownerId,
  index,
  rarity,
  runeTypes = getRuneTypes(),
  random = Math.random,
}: CreateDraftRuneForRarityInput): Rune {
  const runeType = runeTypes[Math.floor(random() * runeTypes.length)];
  return createRune(`draft-${ownerId}-${runeType}-${index}-${random().toString(36).slice(2, 6)}`, runeType, rarity);
}

function createDraftOffers(
  ownerId: string,
  offerCount: number,
  runesPerOffer: number,
  winStreak: number = 0,
  activeArtefacts: ArtefactId[] = []
): DeckDraftOffer[] {
  return Array(offerCount)
    .fill(null)
    .map((_, offerIndex) => {
      const deckDraftEffect = getDeckDraftEffectForIndex(offerIndex);
      const runes: Rune[] = [];

      for (let i = 0; i < runesPerOffer; i++) {
        const baseRarity = rollDraftRarity({ winStreak: winStreak - 1, activeArtefacts });
        const shouldBoostRarity = deckDraftEffect.type === 'betterRunes' && i === 0;
        const rarity = shouldBoostRarity ? boostRarity(baseRarity, deckDraftEffect.rarityStep) : baseRarity;
        runes.push(createDraftRuneForRarity({
          ownerId,
          index: offerIndex * runesPerOffer + i,
          rarity,
        }));
      }

      return {
        id: `${ownerId}-draft-offer-${offerIndex + 1}`,
        ownerId,
        runes,
        deckDraftEffect,
      };
    });
}

export function createDeckDraftState(
  ownerId: string,
  winStreak: number = 0,
  activeArtefacts: ArtefactId[] = [],
  selectionLimit: number
): DeckDraftState {
  return {
    offers: createDraftOffers(ownerId, 3, 4, winStreak, activeArtefacts),
    picksRemaining: 1,
    totalPicks: 1,
    selectionLimit,
    selectionsThisOffer: 0,
  };
}

export function advanceDeckDraftState(
  current: DeckDraftState,
  ownerId: string,
  winStreak: number = 0,
  activeArtefacts: ArtefactId[] = []
): DeckDraftState | null {
  const nextPicks = Math.max(0, current.picksRemaining - 1);
  if (nextPicks === 0) {
    return null;
  }

  return {
    offers: createDraftOffers(ownerId, 3, 4, winStreak, activeArtefacts),
    picksRemaining: nextPicks,
    totalPicks: current.totalPicks,
    selectionLimit: current.selectionLimit,
    selectionsThisOffer: 0,
  };
}

export function mergeDeckWithOffer(deck: Rune[], selectedOffer: DeckDraftOffer): Rune[] {
  return [...deck, ...selectedOffer.runes];
}

export function applyDeckDraftEffectToPlayer(
  player: Player,
  effect: DeckDraftEffect | undefined,
  startingHealth: number
): Player {
  if (!effect) {
    return player;
  }

  const currentMaxHealth = player.maxHealth ?? startingHealth;

  switch (effect.type) {
    case 'heal':
      return { ...player, health: currentMaxHealth };
    case 'maxHealth': {
      const boostedMaxHealth = currentMaxHealth + effect.amount;
      return { ...player, maxHealth: boostedMaxHealth, health: Math.min(boostedMaxHealth, player.health) };
    }
    case 'betterRunes':
      return player;
  }
}

export function getDeckDraftEffectDescription(effect: DeckDraftEffect | undefined): string {
  if (!effect) {
    return '';
  }

  switch (effect.type) {
    case 'heal':
      return 'Restore Health';
    case 'maxHealth':
      return `+${effect.amount} Max health`;
    case 'betterRunes':
      return 'Better Runes';
  }
}
