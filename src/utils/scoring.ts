/**
 * Spell wall geometry helpers.
 */

import type { RuneType } from '../types/game';

export const WALL_SLOT_RUNE_TYPE_ORDER: readonly RuneType[] = [
  'Fire',
  'Life',
  'Wind',
  'Frost',
  'Void',
  'Lightning',
];

export function getWallSlotRuneTypes(row: number, col: number): RuneType[] {
  return [WALL_SLOT_RUNE_TYPE_ORDER[(row + col) % WALL_SLOT_RUNE_TYPE_ORDER.length]];
}

export function canRuneSatisfySlot(runeTypes: readonly RuneType[], acceptedRuneTypes: readonly RuneType[]): boolean {
  return runeTypes.some((runeType) => acceptedRuneTypes.includes(runeType));
}
