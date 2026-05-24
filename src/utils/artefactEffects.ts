/**
 * Artefact effects utilities for game engine
 * Centralizes all artefact effect logic to keep game logic pure and testable
 */

import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import type { GameState } from '../types/game';
import { getEffectRefDescriptions } from './effectCatalog';
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
 * Tome effect: Segments of size 1 deal 5× damage (rune score) and 5× healing and 5x armor
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
    damage: segment.damage * 2,
    healing: segment.healing * 2,
    armor: segment.armor * 2,
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
  let damage = baseDamage;
  
  // Tome applies first (only for size 1 segments)
  if (segmentSize === 1 && hasArtefact(state, 'tome')) {
    damage = damage * 2;
  }
  
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
    healing = healing * 2;
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
  let armorMultiplier = 1;
  if (segmentSize === 1 && hasArtefact(state, 'tome')) {
    armorMultiplier = armorMultiplier * 2;
  }
  if (hasArtefact(state, 'potion')) {
    armorMultiplier = armorMultiplier * 2;
  }
  return armorMultiplier;
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
  const scoreBonus = 0;
  
  return { damage, scoreBonus };
}

/**
 * Get artefact effect description for tooltips
 */
export function getArtefactEffectDescription(artefactId: ArtefactId): string {
  return getEffectRefDescriptions(ARTEFACTS[artefactId]?.passiveEffectRefs).join('\n');
}
