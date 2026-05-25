/**
 * Unit tests for wall-cell to display-rune conversion.
 */

import { describe, expect, it } from 'vitest';
import type { WallCell } from '../types/game';
import { wallCellToRune } from './wallCellRune';

describe('wallCellRune', () => {
  it('preserves wall cell rarity and effect refs for tooltip display runes', () => {
    const cell: WallCell = {
      id: 'wall-copy-void',
      runeType: 'Void',
      rarity: 'rare',
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 4 } }],
      passiveEffectRefs: [{ effectId: 'passive.tomeCastDamage', params: { damageBonus: 1 } }],
    };

    const rune = wallCellToRune(cell, 2, 3);

    expect(rune).toEqual({
      id: 'wall-copy-void',
      runeType: 'Void',
      rarity: 'rare',
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 4 } }],
      passiveEffectRefs: [{ effectId: 'passive.tomeCastDamage', params: { damageBonus: 1 } }],
    });
    expect(rune?.castEffectRefs).not.toBe(cell.castEffectRefs);
    expect(rune?.passiveEffectRefs).not.toBe(cell.passiveEffectRefs);
  });

  it('returns null for empty wall cells', () => {
    expect(
      wallCellToRune(
        {
          id: null,
          runeType: null,
          rarity: null,
          castEffectRefs: null,
          passiveEffectRefs: null,
        },
        0,
        0
      )
    ).toBeNull();
  });
});
