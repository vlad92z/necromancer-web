/**
 * DeckDrafting utilities - helpers for post-victory deck upgrades
 */

import type { DeckDraftEffect, DeckDraftState, DraftRuneforge, Player, Rune, RuneEffectRarity, RuneType } from '../types/game';
import type { ArtefactId } from '../types/artefacts';
import { getDraftEffectsForType } from './runeEffects';
import { RUNE_TYPES } from './gameInitialization';
import type { Runeforge } from '../types/game';
import { modifyDraftRarityWithRing } from './artefactEffects';
import { SOLO_RUN_CONFIG } from './soloRunConfig';
import { DECK_DRAFTING_CONFIG } from './deckDraftingConfig';

//TODO: What are all these for?
const DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT = 3;
const DEFAULT_DECK_DRAFT_SELECTION_LIMIT = 1;

function getDeckDraftEffectForIndex(index: number): DeckDraftEffect {
  const draftEffects = DECK_DRAFTING_CONFIG.draftEffects;
  const effectIndex = index % draftEffects.length;
  return draftEffects[effectIndex];
}

function boostRarity(rarity: RuneEffectRarity, steps: number = 1): RuneEffectRarity {
  const rariryOrder = DECK_DRAFTING_CONFIG.rarityOrder;
  const currentIndex = rariryOrder.indexOf(rarity);
  if (currentIndex === -1) {
    return rarity;
  }
  const boostedIndex = Math.min(rariryOrder.length - 1, currentIndex + steps);
  return rariryOrder[boostedIndex];
}

function getDraftRarity(gameIndex: number, activeArtefacts: ArtefactId[] = []): RuneEffectRarity {
  const config = DECK_DRAFTING_CONFIG;
  const baseEpicChance = Math.min(100, gameIndex * config.epicChanceMultiplier);
  const baseRareChance = Math.min(100 - baseEpicChance, gameIndex * config.rareChanceMultiplier);
  console.log('Draft Rarity Roll:', { baseEpicChance, baseRareChance, gameIndex });
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
  ownerId: string = SOLO_RUN_CONFIG.playerId,
  runeforgeCount: number = DECK_DRAFTING_CONFIG.runeforgeCount,
  gameIndex: number,
  activeArtefacts: ArtefactId[] = []
): DraftRuneforge[] {
  const runeTypes = RUNE_TYPES;
  const capacity = SOLO_RUN_CONFIG.runeforgeCapacity;
  return Array(runeforgeCount)
    .fill(null)
    .map((_, forgeIndex) => {
      const deckDraftEffect = getDeckDraftEffectForIndex(forgeIndex);
      const runes: Rune[] = [];
      for (let i = 0; i < capacity; i++) {
        const runeType = runeTypes[Math.floor(Math.random() * runeTypes.length)];
        const baseRarity = getDraftRarity(gameIndex, activeArtefacts);
        const shouldBoostRarity = deckDraftEffect.type === 'betterRunes' && i === 0;
        const rarity = shouldBoostRarity ? boostRarity(baseRarity, deckDraftEffect.rarityStep) : baseRarity;
        runes.push(createDraftRune(ownerId, runeType, forgeIndex * capacity + i, rarity));
      }

      return {
        id: `raft-forge-${forgeIndex + 1}`,
        runes,
        deckDraftEffect,
      };
    });
}

export function createDeckDraftState(
  ownerId: string,
  totalPicks: number,
  gameIndex: number,
  activeArtefacts: ArtefactId[],
  selectionLimit: number,
): DeckDraftState {
  return {
    runeforges: createDraftRuneforges(
      ownerId,
      DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
      gameIndex,
      activeArtefacts
    ),
    picksRemaining: totalPicks,
    totalPicks,
    selectionLimit,
    selectionsThisOffer: 2,//TODO: Why 2?
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

  const selectionLimit = current.selectionLimit ?? DEFAULT_DECK_DRAFT_SELECTION_LIMIT;

  return {
    runeforges: createDraftRuneforges(
      ownerId,
      DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
      winStreak,
      activeArtefacts
    ),
    picksRemaining: nextPicks,
    totalPicks: current.totalPicks,
    selectionLimit,
    selectionsThisOffer: 0,
  };
}

export function mergeDeckWithRuneforge(deck: Rune[], selectedRuneforge: DraftRuneforge): Rune[] {
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
