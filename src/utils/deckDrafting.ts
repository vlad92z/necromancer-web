/**
 * DeckDrafting utilities - helpers for post-victory deck upgrades
 */

import type { DeckDraftState, Rune, RuneType, RuneTypeCount } from '../types/game';
import { getRuneEffectsForType } from './runeEffects';
import type { RuneEffectTuning } from './runeEffects';
import { getRuneTypesForCount } from './gameInitialization';
import type { Runeforge } from '../types/game';

const DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT = 3;
const DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE = 4;

const createDraftRune = (ownerId: string, runeType: RuneType, index: number, runeEffectTuning?: RuneEffectTuning): Rune => ({
  id: `draft-${ownerId}-${runeType}-${index}-${Math.random().toString(36).slice(2, 6)}`,
  runeType,
  effects: getRuneEffectsForType(runeType, runeEffectTuning),
});

function createDraftRuneforges(
  runeTypeCount: RuneTypeCount,
  ownerId: string,
  runeforgeCount: number = DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
  runesPerRuneforge: number = DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE,
  runeEffectTuning?: RuneEffectTuning
): Runeforge[] {
  const runeTypes = getRuneTypesForCount(runeTypeCount);

  return Array(runeforgeCount)
    .fill(null)
    .map((_, forgeIndex) => {
      const runes: Rune[] = [];
      for (let i = 0; i < runesPerRuneforge; i++) {
        const runeType = runeTypes[Math.floor(Math.random() * runeTypes.length)];
        runes.push(createDraftRune(ownerId, runeType, forgeIndex * runesPerRuneforge + i, runeEffectTuning));
      }

      return {
        id: `${ownerId}-draft-forge-${forgeIndex + 1}`,
        ownerId,
        runes,
      };
    });
}

export function createDeckDraftState(
  runeTypeCount: RuneTypeCount,
  ownerId: string,
  totalPicks: number = DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT,
  runeEffectTuning?: RuneEffectTuning
): DeckDraftState {
  return {
    runeforges: createDraftRuneforges(runeTypeCount, ownerId, DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT, DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE, runeEffectTuning),
    picksRemaining: totalPicks,
    totalPicks,
  };
}

export function advanceDeckDraftState(
  current: DeckDraftState,
  runeTypeCount: RuneTypeCount,
  ownerId: string,
  runeEffectTuning?: RuneEffectTuning
): DeckDraftState | null {
  const nextPicks = Math.max(0, current.picksRemaining - 1);
  if (nextPicks === 0) {
    return null;
  }

  return {
    runeforges: createDraftRuneforges(runeTypeCount, ownerId, DEFAULT_DECK_DRAFT_RUNEFORGE_COUNT, DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE, runeEffectTuning),
    picksRemaining: nextPicks,
    totalPicks: current.totalPicks,
  };
}

export function mergeDeckWithRuneforge(deck: Rune[], selectedRuneforge: Runeforge): Rune[] {
  return [...deck, ...selectedRuneforge.runes];
}
