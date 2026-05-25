/**
 * Spell wall geometry helpers.
 */

import type { RuneType, WallSlotFamily } from '../types/game';

export const WALL_SLOT_FAMILY_RUNE_TYPES: Record<WallSlotFamily, readonly RuneType[]> = {
  fireVoid: ['Fire', 'Void'],
  lightningWind: ['Lightning', 'Wind'],
  lifeFrost: ['Life', 'Frost'],
};

export const WALL_SLOT_FAMILY_LABELS: Record<WallSlotFamily, string> = {
  fireVoid: 'Fire/Void',
  lightningWind: 'Lightning/Wind',
  lifeFrost: 'Life/Frost',
};

const WALL_SLOT_FAMILY_ORDER: readonly WallSlotFamily[] = ['fireVoid', 'lightningWind', 'lifeFrost'];

export function getWallSlotFamily(row: number, col: number): WallSlotFamily {
  return WALL_SLOT_FAMILY_ORDER[(row + col) % WALL_SLOT_FAMILY_ORDER.length];
}

export function getWallSlotFamilyRuneTypes(slotFamily: WallSlotFamily): readonly RuneType[] {
  return WALL_SLOT_FAMILY_RUNE_TYPES[slotFamily];
}

export function getWallSlotFamilyLabel(slotFamily: WallSlotFamily): string {
  return WALL_SLOT_FAMILY_LABELS[slotFamily];
}

export function isRuneTypeAcceptedBySlotFamily(runeType: RuneType, slotFamily: WallSlotFamily): boolean {
  return WALL_SLOT_FAMILY_RUNE_TYPES[slotFamily].includes(runeType);
}
