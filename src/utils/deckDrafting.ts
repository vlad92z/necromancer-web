/**
 * DeckDrafting utilities - helpers for post-victory deck upgrades
 */

import type { DeckDraftEffect, DeckDraftState, Player, Rune, RuneEffectRarity, RuneType } from '../types/game';
import type { ArtefactId } from '../types/artefacts';
import { createRune } from './runeEffects';
import { getRuneTypes } from './gameInitialization';
import type { Runeforge } from '../types/game';
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
  const effectIndex = index % DECK_DRAFT_EFFECTS.length;
  return DECK_DRAFT_EFFECTS[effectIndex];
}

function boostRarity(rarity: RuneEffectRarity, steps: number = 1): RuneEffectRarity {
  const currentIndex = RARITY_SEQUENCE.indexOf(rarity);
  if (currentIndex === -1) {
    return rarity;
  }
  const boostedIndex = Math.min(RARITY_SEQUENCE.length - 1, currentIndex + steps);
  return RARITY_SEQUENCE[boostedIndex];
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

  return {
    epicChance,
    rareChance,
    selectionLimit,
  };
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

  if (roll < epicChance) {
    return 'epic';
  }
  if (roll < epicChance + rareChance) {
    return 'rare';
  }
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

function createDraftRuneforges(
  ownerId: string,
  runeforgeCount: number,
  runesPerRuneforge: number,
  winStreak: number = 0,
  activeArtefacts: ArtefactId[] = []
): Runeforge[] {
  return Array(runeforgeCount)
    .fill(null)
    .map((_, forgeIndex) => {
      const deckDraftEffect = getDeckDraftEffectForIndex(forgeIndex);
      const runes: Rune[] = [];
      for (let i = 0; i < runesPerRuneforge; i++) {
        const baseRarity = rollDraftRarity({ winStreak: winStreak - 1, activeArtefacts });
        const shouldBoostRarity = deckDraftEffect.type === 'betterRunes' && i === 0;
        const rarity = shouldBoostRarity ? boostRarity(baseRarity, deckDraftEffect.rarityStep) : baseRarity;
        runes.push(createDraftRuneForRarity({
          ownerId,
          index: forgeIndex * runesPerRuneforge + i,
          rarity,
        }));
      }

      return {
        id: `${ownerId}-draft-forge-${forgeIndex + 1}`,
        ownerId,
        runes,
        deckDraftEffect,
        disabled: false,
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
    runeforges: createDraftRuneforges(ownerId, 3, 4, winStreak, activeArtefacts),
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

  const selectionLimit = current.selectionLimit;

  return {
    runeforges: createDraftRuneforges(
      ownerId,
      3,
      4,
      winStreak,
      activeArtefacts
    ),
    picksRemaining: nextPicks,
    totalPicks: current.totalPicks,
    selectionLimit,
    selectionsThisOffer: 0,
  };
}

export function mergeDeckWithRuneforge(deck: Rune[], selectedRuneforge: Runeforge): Rune[] {
  return [...deck, ...selectedRuneforge.runes];
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
    case 'heal': {
      const nextHealth = currentMaxHealth;
      return { ...player, health: nextHealth };
    }
    case 'maxHealth': {
      const boostedMaxHealth = currentMaxHealth + effect.amount;
      const clampedHealth = Math.min(boostedMaxHealth, player.health);
      return { ...player, maxHealth: boostedMaxHealth, health: clampedHealth };
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
      return `Restore Health`;
    case 'maxHealth':
      return `+${effect.amount} Max health`;
    case 'betterRunes':
      return 'Better Runes';
  }
}
