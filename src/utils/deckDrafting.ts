/**
 * DeckDrafting utilities - helpers for post-victory deck upgrades
 */

import type { DeckDraftEffect, DeckDraftState, Player, Rune, RuneEffectRarity, RuneType } from '../types/game';
import type { ArtefactId } from '../types/artefacts';
import { getDraftEffectsForType } from './runeEffects';
import { getRuneTypes } from './gameInitialization';
import type { Runeforge } from '../types/game';
import { modifyDraftRarityWithRing } from './artefactEffects';

//TODO: What are all these for?
const DEFAULT_DRAFT_PICK_COUNT = 3;
const DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT = 3;
const DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE = 4;

const BASE_EPIC_CHANCE = 0;
const BASE_RARE_CHANCE = 0;
const EPIC_INCREMENT_PER_WIN = 1;
const RARE_INCREMENT_PER_WIN = 5;

const DECK_DRAFT_EFFECTS: DeckDraftEffect[] = [
  { type: 'heal', amount: 30 },
  { type: 'maxHealth', amount: 10 },
  { type: 'betterRunes', rarityStep: 1 },
];

const RARITY_SEQUENCE: RuneEffectRarity[] = ['common', 'uncommon', 'rare', 'epic'];

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

function getDraftRarity(winStreak: number, activeArtefacts: ArtefactId[] = []): RuneEffectRarity {
  const baseEpicChance = Math.min(100, BASE_EPIC_CHANCE + winStreak * EPIC_INCREMENT_PER_WIN);
  const baseRareChance = Math.min(100 - baseEpicChance, BASE_RARE_CHANCE + winStreak * RARE_INCREMENT_PER_WIN);
  
  const hasRing = activeArtefacts.includes('ring');
  const { epicChance, rareChance } = modifyDraftRarityWithRing(
    baseEpicChance,
    baseRareChance,
    hasRing
  );
  
  const roll = Math.random() * 100;

  if (roll < epicChance) {
    return 'epic';
  }
  if (roll < epicChance + rareChance) {
    return 'rare';
  }
  return 'uncommon';
}

const createDraftRune = (ownerId: string, runeType: RuneType, index: number, rarity: RuneEffectRarity): Rune => {
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
  winStreak: number = 0,
  activeArtefacts: ArtefactId[] = []
): Runeforge[] {
  const runeTypes = getRuneTypes();

  return Array(runeforgeCount)
    .fill(null)
    .map((_, forgeIndex) => {
      const deckDraftEffect = getDeckDraftEffectForIndex(forgeIndex);
      const runes: Rune[] = [];
      for (let i = 0; i < runesPerRuneforge; i++) {
        const runeType = runeTypes[Math.floor(Math.random() * runeTypes.length)];
        const baseRarity = getDraftRarity(winStreak - 1, activeArtefacts);
        const shouldBoostRarity = deckDraftEffect.type === 'betterRunes' && i === 0;
        const rarity = shouldBoostRarity ? boostRarity(baseRarity, deckDraftEffect.rarityStep) : baseRarity;
        runes.push(createDraftRune(ownerId, runeType, forgeIndex * runesPerRuneforge + i, rarity));
      }

      return {
        id: `${ownerId}-draft-forge-${forgeIndex + 1}`,
        ownerId,
        runes,
        deckDraftEffect,
      };
    });
}

export function createDeckDraftState(
  ownerId: string,
  totalPicks: number = DEFAULT_DRAFT_PICK_COUNT,
  winStreak: number = 0,
  activeArtefacts: ArtefactId[] = []
): DeckDraftState {
  return {
    runeforges: createDraftRuneforges(
      ownerId,
      DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
      DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE,
      winStreak,
      activeArtefacts
    ),
    picksRemaining: totalPicks,
    totalPicks,
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
    runeforges: createDraftRuneforges(
      ownerId,
      DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
      DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE,
      winStreak,
      activeArtefacts
    ),
    picksRemaining: nextPicks,
    totalPicks: current.totalPicks,
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
      const nextHealth = Math.min(currentMaxHealth, player.health + effect.amount);
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
      return `Heal ${effect.amount} health`;
    case 'maxHealth':
      return `+${effect.amount} max health`;
    case 'betterRunes':
      return 'Better Runes';
  }
}
