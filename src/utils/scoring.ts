/**
 * Spell wall geometry helpers.
 */

import type { RuneType } from '../types/game';
import { RUNE_TYPES } from './gameInitialization';

export function getRuneOrderForSize(size: number): RuneType[] {
  return RUNE_TYPES.slice(0, size);
}

export function getExpectedRuneType(row: number, col: number, size: number): RuneType {
  const runeTypes = getRuneOrderForSize(size);
  return runeTypes[(col - row + size) % size];
}
