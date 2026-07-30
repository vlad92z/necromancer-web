/**
 * Tooltip card builders - helper functions to map game data to tooltip cards
 */

import type { Rune, TooltipCard } from '../types/game';
import { getRuneEffectDescription } from './runeEffects';
import { getPrimaryRuneType } from './runeHelpers';

function orderPrimaryFirst<T extends { id: string }>(items: T[], primaryId?: string | null): T[] {
  if (!primaryId) {
    return items;
  }

  const primary = items.find((item) => item.id === primaryId);
  if (!primary) {
    return items;
  }

  const remaining = items.filter((item) => item.id !== primaryId);
  return [primary, ...remaining];
}

/**
 * Build tooltip cards for rune collections, keeping the primary rune first.
 */
export function buildRuneTooltipCards(runes: Rune[], primaryRuneId?: string | null): TooltipCard[] {
  const orderedRunes = orderPrimaryFirst(runes, primaryRuneId);
  return orderedRunes.map((rune, index) => {
    const runeType = getPrimaryRuneType(rune);
    return {
      id: `rune-tooltip-${rune.id}-${index}`,
      runeType,
      title: rune.name,
      description: getRuneEffectDescription(rune),
      runeRarity: rune.rarity,
      imageSrc: rune.cardImageSrc,
    };
  });
}
