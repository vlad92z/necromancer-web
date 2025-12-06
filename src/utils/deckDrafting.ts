/**
 * DeckDrafting utilities - helpers for post-victory deck upgrades
 */

import type { DeckDraftState, Rune, RuneEffectRarity, RuneType } from '../types/game';
import { getDraftEffectsForType } from './runeEffects';
import { getRuneTypes } from './gameInitialization';
import type { Runeforge } from '../types/game';

const DEFAULT_DRAFT_PICK_COUNT = 3;
const DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT = 3;
const DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE = 4;

const BASE_EPIC_CHANCE = 1;
const BASE_RARE_CHANCE = 5;
const EPIC_INCREMENT_PER_WIN = 1;
const RARE_INCREMENT_PER_WIN = 5;

function getDraftRarity(winStreak: number): RuneEffectRarity {
  const epicChance = Math.min(100, BASE_EPIC_CHANCE + winStreak * EPIC_INCREMENT_PER_WIN);
  const rareChance = Math.min(100 - epicChance, BASE_RARE_CHANCE + winStreak * RARE_INCREMENT_PER_WIN);
  const roll = Math.random() * 100;

  if (roll < epicChance) {
    return 'epic';
  }
  if (roll < epicChance + rareChance) {
    return 'rare';
  }
  return 'uncommon';
}

const createDraftRune = (ownerId: string, runeType: RuneType, index: number, winStreak: number): Rune => {
  const rarity = getDraftRarity(winStreak);
  return {
    id: `draft-${ownerId}-${runeType}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    runeType,
    effects: getDraftEffectsForType(runeType, rarity),
  };
};

function createDraftRuneforges(
  ownerId: string,
  runeforgeCount: number = DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
  runesPerRuneforge: number = DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE,
  winStreak: number = 0
): Runeforge[] {
  const runeTypes = getRuneTypes();

  return Array(runeforgeCount)
    .fill(null)
    .map((_, forgeIndex) => {
      const runes: Rune[] = [];
      for (let i = 0; i < runesPerRuneforge; i++) {
        const runeType = runeTypes[Math.floor(Math.random() * runeTypes.length)];
        runes.push(createDraftRune(ownerId, runeType, forgeIndex * runesPerRuneforge + i, winStreak));
      }

      return {
        id: `${ownerId}-draft-forge-${forgeIndex + 1}`,
        ownerId,
        runes,
      };
    });
}

export function createDeckDraftState(
  ownerId: string,
  totalPicks: number = DEFAULT_DRAFT_PICK_COUNT,
  winStreak: number = 0
): DeckDraftState {
  return {
    runeforges: createDraftRuneforges(
      ownerId,
      DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
      DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE,
      winStreak
    ),
    picksRemaining: totalPicks,
    totalPicks,
  };
}

export function advanceDeckDraftState(
  current: DeckDraftState,
  ownerId: string,
  winStreak: number = 0
): DeckDraftState | null {
  const nextPicks = Math.max(0, current.picksRemaining - 1);
  if (nextPicks === 0) {
    return null;
  }

  return {
    runeforges: createDraftRuneforges(
      ownerId,
      DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
      DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE,
      winStreak
    ),
    picksRemaining: nextPicks,
    totalPicks: current.totalPicks,
  };
}

export function mergeDeckWithRuneforge(deck: Rune[], selectedRuneforge: Runeforge): Rune[] {
  return [...deck, ...selectedRuneforge.runes];
}
