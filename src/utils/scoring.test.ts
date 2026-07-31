import { describe, expect, it } from 'vitest';
import { canRuneSatisfySlot, getWallSlotRuneTypes } from './scoring';

describe('scoring wall slot rune types', () => {
  it('assigns one rune type to each slot in a row-offset loop', () => {
    expect([
      [getWallSlotRuneTypes(0, 0), getWallSlotRuneTypes(0, 1), getWallSlotRuneTypes(0, 2)],
      [getWallSlotRuneTypes(1, 0), getWallSlotRuneTypes(1, 1), getWallSlotRuneTypes(1, 2)],
    ]).toEqual([
      [['Fire'], ['Life'], ['Wind']],
      [['Life'], ['Wind'], ['Frost']],
    ]);
  });

  it('accepts a rune when any card type satisfies any slot type', () => {
    expect(canRuneSatisfySlot(['Fire'], ['Fire'])).toBe(true);
    expect(canRuneSatisfySlot(['Fire', 'Wind'], ['Wind', 'Life'])).toBe(true);
    expect(canRuneSatisfySlot(['Void'], ['Life'])).toBe(false);
  });
});
