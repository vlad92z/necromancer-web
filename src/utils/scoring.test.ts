import { describe, expect, it } from 'vitest';
import {
  getWallSlotFamily,
  getWallSlotFamilyLabel,
  getWallSlotFamilyRuneTypes,
  isRuneTypeAcceptedBySlotFamily,
} from './scoring';

describe('scoring wall slot families', () => {
  it('uses the row-offset Fire/Void, Lightning/Wind, Life/Frost loop', () => {
    expect([
      [getWallSlotFamily(0, 0), getWallSlotFamily(0, 1), getWallSlotFamily(0, 2)],
      [getWallSlotFamily(1, 0), getWallSlotFamily(1, 1), getWallSlotFamily(1, 2)],
      [getWallSlotFamily(2, 0), getWallSlotFamily(2, 1), getWallSlotFamily(2, 2)],
    ]).toEqual([
      ['fireVoid', 'lightningWind', 'lifeFrost'],
      ['lightningWind', 'lifeFrost', 'fireVoid'],
      ['lifeFrost', 'fireVoid', 'lightningWind'],
    ]);
  });

  it('defines labels and accepted rune types for each family', () => {
    expect(getWallSlotFamilyLabel('fireVoid')).toBe('Fire/Void');
    expect(getWallSlotFamilyRuneTypes('lightningWind')).toEqual(['Lightning', 'Wind']);
    expect(isRuneTypeAcceptedBySlotFamily('Life', 'lifeFrost')).toBe(true);
    expect(isRuneTypeAcceptedBySlotFamily('Void', 'lifeFrost')).toBe(false);
  });
});
