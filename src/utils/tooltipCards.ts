/**
 * Tooltip card builders - helper functions to map game data to tooltip cards
 */

import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import type { PatternLine, Rune, RuneType, TooltipCard } from '../types/game';
import { getArtefactEffectDescription } from './artefactEffects';
import { getRuneEffectDescription } from './runeEffects';
import overloadSvg from '../assets/stats/overload.svg';

const FALLBACK_RUNE_TYPE: RuneType = 'Life';
const OVERLOAD_DESCRIPTION_SUFFIX = (damage: number) => `Rune will overload for ${damage} damage.`;
const NON_PRIMARY_DESTROYED_TEXT = 'Rune will be destroyed during casting.';

interface PatternLinePlacementTooltipOptions {
  selectedRunes: Rune[];
  patternLineTier: number;
  patternLineCount: number;
  overloadDamage: number;
}

function getRuneTooltipTitle(rune: Rune): string {
  return `${rune.runeType} Rune`;
}

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
    title: `${rune.runeType} Rune`,
    description: getRuneEffectDescription(rune.effect),
    runeRarity: rune.rarity,
    imageSrc: '', // Could add rune image mapping here if needed
    variant: 'default',
  }));
}

export function buildPatternLinePlacementTooltipCards({
  selectedRunes,
  patternLineTier,
  patternLineCount,
  overloadDamage,
}: PatternLinePlacementTooltipOptions): TooltipCard[] {
  if (selectedRunes.length === 0) {
    return [];
  }

  const orderedCards: TooltipCard[] = [];
  const availableSlots = Math.max(patternLineTier - patternLineCount, 0);
  const hasPrimarySlot = patternLineCount === 0 && availableSlots > 0;
  let cursor = 0;

  if (hasPrimarySlot) {
    const primaryRune = selectedRunes[cursor];
    orderedCards.push({
      id: `pattern-primary-${primaryRune.id}-${cursor}`,
      title: getRuneTooltipTitle(primaryRune),
      description: getRuneEffectDescription(primaryRune.effect),
      runeRarity: primaryRune.rarity,
      imageSrc: '', // Could add rune image mapping here if needed
      variant: 'default',
    });
    cursor += 1;
  }

  const nonPrimarySlots = hasPrimarySlot ? Math.max(availableSlots - 1, 0) : availableSlots;
  const nonPrimaryRunes = selectedRunes.slice(cursor, cursor + nonPrimarySlots);
  nonPrimaryRunes.forEach((rune, index) => {
    orderedCards.push({
      id: `pattern-non-primary-${rune.id}-${index}`,
      title: getRuneTooltipTitle(rune),
      description: NON_PRIMARY_DESTROYED_TEXT,
      variant: 'nonPrimary',
      imageSrc: '', // Could add rune image mapping here if needed
      runeRarity: rune.rarity,
    });
  });
  cursor += nonPrimaryRunes.length;

  const overloadRunes = selectedRunes.slice(cursor);
  overloadRunes.forEach((rune, index) => {
    orderedCards.push({
      id: `pattern-overload-${rune.id}-${index}`,
      title: getRuneTooltipTitle(rune),
      description: OVERLOAD_DESCRIPTION_SUFFIX(overloadDamage),
      imageSrc: overloadSvg,
      variant: 'overload',
      runeRarity: rune.rarity,
    });
  });

  return orderedCards;
}

export function buildPatternLineExistingTooltipCards(patternLine: PatternLine): TooltipCard[] {
  const patternLinesRunes = patternLine.runes;
  if (patternLinesRunes.length === 0) {
    return [];
  }

  const primaryRune = patternLinesRunes[0]
  const runeType = patternLinesRunes[0].runeType;

  const tooltipCards: TooltipCard[] = [
    {
      id: `pattern-line-primary-${primaryRune.id}`,
      title: getRuneTooltipTitle(primaryRune),
      description: getRuneEffectDescription(primaryRune.effect),
      runeRarity: primaryRune.rarity,
      imageSrc: '', // Could add rune image mapping here if needed
      variant: 'default',
    },
  ];

  const destroyedCount = Math.max(patternLinesRunes.length - 1, 0);
  for (let index = 0; index < destroyedCount; index += 1) {
    tooltipCards.push({
      id: `pattern-line-destroyed-${primaryRune.id}-${index}`,
      title: getRuneTooltipTitle(primaryRune),
      description: NON_PRIMARY_DESTROYED_TEXT,
      variant: 'nonPrimary',
      runeRarity: primaryRune.rarity,
      imageSrc: '', // Could add rune image mapping here if needed
    });
  }

  return tooltipCards;
}

export function buildOverloadPlacementTooltipCards(selectedRunes: Rune[], strain: number): TooltipCard[] {
  return selectedRunes.map((rune, index) => ({
    id: `overload-preview-${rune.id}-${index}`,
    runeType: rune.runeType,
    title: getRuneTooltipTitle(rune),
    description: OVERLOAD_DESCRIPTION_SUFFIX(strain),
    imageSrc: overloadSvg,
    variant: 'overload',
    runeRarity: rune.rarity,
  }));
}

/**
 * Build tooltip cards for artefacts, showing the focused artefact first and
 * preserving other active artefacts afterwards.
 */
export function buildArtefactTooltipCards(
  activeArtefactIds: ArtefactId[]
): TooltipCard[] {

  return [];
    // .map<TooltipCard>((artefactId, index) => {
    //   const artefact = ARTEFACTS[artefactId];
    //   if (!artefact) {
    //     return null;
    //   }
    //   return {
    //     id: `artefact-tooltip-${artefactId}-${index}`,
    //     runeType: FALLBACK_RUNE_TYPE,
    //     title: artefact.name,
    //     description: getArtefactEffectDescription(artefactId),
    //     imageSrc: artefact.image,
    //   };
    // })
    // .filter((card): card is TooltipCard => card !== null);
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
      title,
      description,
      runeRarity: 'common',
      imageSrc: '',
      variant: 'default',
      
    },
  ];
}
