/**
 * Unit tests for rune effect ref helpers.
 */

import { describe, expect, it } from 'vitest';
import { createRune, getRuneCastEffectRefsForType, getRuneEffectDescription } from './runeEffects';

describe('runeEffects', () => {
  it('creates common runes with legacy-equivalent cast refs and direct rarity', () => {
    const rune = createRune('fire-common', 'Fire', 'common');

    expect(rune).toMatchObject({
      id: 'fire-common',
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 3 } }],
      passiveEffectRefs: [],
    });
  });

  it('creates draft refs by rarity without storing rarity in params', () => {
    const refs = getRuneCastEffectRefsForType('Frost', 'rare');

    expect(refs).toEqual([{ effectId: 'cast.armorSynergy', params: { amount: 3, synergyType: 'Frost' } }]);
    expect(refs[0]?.params).not.toHaveProperty('rarity');
  });

  it('renders rune descriptions from catalog refs', () => {
    const rune = createRune('void-epic', 'Void', 'epic');

    expect(getRuneEffectDescription(rune)).toBe('• Deal 6 damage for every Void rune in your completed wall');
  });
});
