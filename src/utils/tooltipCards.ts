/**
 * Tooltip card builders - helper functions to map game data to tooltip cards
 */

import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import type { Rune, RuneType, TooltipCard } from '../types/game';
import { getArtefactEffectDescription } from './artefactEffects';
import { getRuneEffectDescription } from './runeEffects';

const FALLBACK_RUNE_TYPE: RuneType = 'Life';

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
  return orderedRunes.map((rune, index) => ({
    id: `rune-tooltip-${rune.id}-${index}`,
    runeType: rune.runeType,
    title: `${rune.runeType} Rune`,
    description: getRuneEffectDescription(rune.effects),
  }));
}

/**
 * Build tooltip cards for artefacts, showing the focused artefact first and
 * preserving other active artefacts afterwards.
 */
export function buildArtefactTooltipCards(
  activeArtefactIds: ArtefactId[],
  primaryArtefactId: ArtefactId
): TooltipCard[] {
  const orderedArtefacts = orderPrimaryFirst(
    activeArtefactIds.map((id) => ({ id })),
    primaryArtefactId
  ).map(({ id }) => id);

  return orderedArtefacts
    .map((artefactId, index) => {
      const artefact = ARTEFACTS[artefactId];
      if (!artefact) {
        return null;
      }
      return {
        id: `artefact-tooltip-${artefactId}-${index}`,
        runeType: FALLBACK_RUNE_TYPE,
        title: artefact.name,
        description: getArtefactEffectDescription(artefactId),
        imageSrc: artefact.image,
      };
    })
    .filter((card): card is TooltipCard => Boolean(card));
}

/**
 * Build a single text-based tooltip card (e.g., for deck/overload counters).
 */
export function buildTextTooltipCard(
  id: string,
  title: string,
  description: string,
  imageSrc?: string,
  runeType: RuneType = FALLBACK_RUNE_TYPE
): TooltipCard[] {
  return [
    {
      id,
      runeType,
      title,
      description,
      imageSrc,
    },
  ];
}
