/**
 * Rune utility functions
 */

import type { RuneType } from '../types/game';
import { SOLO_RUN_CONFIG } from './soloRunConfig';

/**
 * Get the effect description for a rune type
 */
export function getRuneEffectDescription(runeType: RuneType): string {  
  const descriptions: Record<RuneType, string> = {
    Fire: 'Fire',
    Frost: 'Frost',
    Life: 'Life',
    Void: 'Void',
    Wind: 'Wind',
    Lightning: 'Lightning',
  };
  return descriptions[runeType];
}

export function getRuneType(row: number, column: number): RuneType {
  const runeTypes = SOLO_RUN_CONFIG.runeTypes;
  const size = runeTypes.length;
  return runeTypes[(row - column + size) % size]; // offset by 1 to the right
}

/**
 * Given a `row` and a `RuneType`, return the column index that yields that
 * rune when passed to `getRuneType`. Uses the same 0-based indexing as
 * `getRuneType` and the `SOLO_RUN_CONFIG.runeTypes` ordering.
 */
export function getColumn(row: number, type: RuneType): number {
  const runeTypes = SOLO_RUN_CONFIG.runeTypes;
  const size = runeTypes.length;
  const targetIndex = runeTypes.indexOf(type);
  if (targetIndex === -1) {
    return 0;
  }
  return (row - targetIndex + size) % size;
}
