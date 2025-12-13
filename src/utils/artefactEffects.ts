/**
 * Artefact effects utilities for game engine
 * Centralizes all artefact effect logic to keep game logic pure and testable
 */

import type { ArtefactId } from '../types/artefacts';
import type { GameState } from '../types/game';
import type { ResolvedSegment } from './scoring';

/**
 * Get active artefacts from game state
 */
export function getActiveArtefacts(state: GameState): ArtefactId[] {
  return state.activeArtefacts ?? [];
}

/**
 * Check if a specific artefact is active
 */
export function hasArtefact(state: GameState, artefactId: ArtefactId): boolean {
  return getActiveArtefacts(state).includes(artefactId);
}

/**
 * Ring effect: Double the odds of drafting epic runes
 * Modifies the rarity probabilities when generating draft runes
 */
export function modifyDraftRarityWithRing(
  baseEpicChance: number,
  baseRareChance: number,
  hasRing: boolean
): { epicChance: number; rareChance: number; uncommonChance: number } {
  if (!hasRing) {
    const uncommonChance = 100 - baseEpicChance - baseRareChance;
    return { epicChance: baseEpicChance, rareChance: baseRareChance, uncommonChance };
  }

  // Double epic odds, but cap total at 100%
  const modifiedEpicChance = Math.min(100, baseEpicChance * 2);
  
  // Redistribute remaining probability between rare and uncommon proportionally
  const remainingProbability = 100 - modifiedEpicChance;
  const originalNonEpic = 100 - baseEpicChance;
  
  let rareChance: number;
  let uncommonChance: number;
  
  if (originalNonEpic > 0) {
    const rareProportion = baseRareChance / originalNonEpic;
    rareChance = remainingProbability * rareProportion;
    uncommonChance = remainingProbability * (1 - rareProportion);
  } else {
    rareChance = 0;
    uncommonChance = 0;
  }

  return {
    epicChance: modifiedEpicChance,
    rareChance,
    uncommonChance,
  };
}

/**
 * Robe effect: Increase total picks by 1 during deck drafting
 */
export function modifyDraftPicksWithRobe(basePicks: number, hasRobe: boolean): number {
  return hasRobe ? basePicks + 1 : basePicks; //TODO: This should let the pick an extra from the existing picks
}

/**
 * Potion effect: Double all damage dealt
 */
export function modifyOutgoingDamageWithPotion(damage: number, hasPotion: boolean): number {
  return hasPotion ? damage * 2 : damage;
}

/**
 * Potion effect: Triple all damage taken
 */
export function modifyIncomingDamageWithPotion(damage: number, hasPotion: boolean): number {
  return hasPotion ? damage * 3 : damage;
}

/**
 * Rod effect: All damage taken is also added to Rune Score
 * This is called after damage is applied to return the score bonus
 */
export function getDamageToScoreBonusWithRod(damage: number, hasRod: boolean): number {
  return hasRod ? damage : 0;
}

/**
 * Tome effect: Segments of size 1 deal 10× damage (rune score) and 10× healing and 10x armor
 */
export function modifySegmentResultWithTome(
  segment: ResolvedSegment,
  hasTome: boolean
): ResolvedSegment {
  if (!hasTome || segment.segmentSize !== 1) {
    return segment;
  }

  return {
    ...segment,
    damage: segment.damage * 10,
    healing: segment.healing * 10,
    armor: segment.armor * 10,
  };
}

/**
 * Apply all artefact modifiers to outgoing damage
 * Order: Base damage → Tome (if size 1) → Potion
 */
export function applyOutgoingDamageModifiers(
  baseDamage: number,
  segmentSize: number,
  state: GameState
): number {
  const damage = baseDamage;
  
  // Tome applies first (only for size 1 segments)
  if (segmentSize === 1 && hasArtefact(state, 'tome')) {
    damage = damage * 10;
  }
  
  // // Potion applies to final damage
  // if (hasArtefact(state, 'potion')) {
  //   damage = damage * 2;
  // }
  
  return damage;
}

/**
 * Apply all artefact modifiers to outgoing healing
 * Order: Base healing → Tome (if size 1)
 */
export function applyOutgoingHealingModifiers(
  baseHealing: number,
  segmentSize: number,
  state: GameState
): number {
  let healing = baseHealing;
  
  // Tome applies to healing (only for size 1 segments)
  if (segmentSize === 1 && hasArtefact(state, 'tome')) {
    healing = healing * 10;
  }
  
  if (hasArtefact(state, 'rod')) {
    healing = healing * 2;
  }
  return healing;
}

/**
 * Get the armor multiplier for resolved segments after artefact modifiers.
 */
export function getArmorGainMultiplier(segmentSize: number, state: GameState): number {
  const healingMultiplier = applyOutgoingHealingModifiers(1, segmentSize, state);
  const potionArmorMultiplier = 1;//hasArtefact(state, 'potion') ? 2 : 1;
  return healingMultiplier * potionArmorMultiplier;
}

/**
 * Apply all artefact modifiers to incoming damage
 * Order: Base damage → Potion
 * Returns both modified damage and score bonus from Rod
 */
export function applyIncomingDamageModifiers(
  baseDamage: number,
  state: GameState
): { damage: number; scoreBonus: number } {
  const damage = baseDamage;
  console.log('Artefacts:', state.activeArtefacts);
  // // Potion multiplies incoming damage
  // if (hasArtefact(state, 'potion')) {
  //   damage = damage * 3;
  // }
  
  // Rod converts damage to score (uses post-Potion damage)
  const scoreBonus = 0;//hasArtefact(state, 'rod') ? damage : 0;
  
  return { damage, scoreBonus };
}

/**
 * Get artefact effect description for tooltips
 */
export function getArtefactEffectDescription(artefactId: ArtefactId): string {
  const descriptions: Record<ArtefactId, string> = {
    ring: 'Double the odds of drafting epic runes',
    rod: 'Double all healing', //TODO Why two effects?
    potion: 'Double all armor gained', //TODO: This should not double all armor or should it?
    robe: 'Increase total picks by 1 during deck drafting',
    tome: 'Segments of size 1 add 10× more runescore, 10× healing, and 10× armor',
  };
  
  return descriptions[artefactId];
}
