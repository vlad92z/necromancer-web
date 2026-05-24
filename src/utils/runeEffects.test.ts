/**
 * Unit tests for rune effect ref helpers.
 */

import { describe, expect, it } from 'vitest';
import { createRune, getRuneCastEffectRefsForType, getRuneEffectDescription } from './runeEffects';

describe('runeEffects', () => {
  it('creates common runes with Stage 1 identity refs and direct rarity', () => {
    const rune = createRune('fire-common', 'Fire', 'common');

    expect(rune).toMatchObject({
      id: 'fire-common',
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [{ effectId: 'cast.damageAdjacent', params: { amount: 1 } }],
      passiveEffectRefs: [],
    });
  });

  it('maps all common rune identities to Stage 1 refs', () => {
    expect(createRune('frost-common', 'Frost', 'common').castEffectRefs).toEqual([
      { effectId: 'cast.armor', params: { amount: 3 } },
    ]);
    expect(createRune('life-common', 'Life', 'common').castEffectRefs).toEqual([
      { effectId: 'cast.healing', params: { amount: 2 } },
    ]);
    expect(createRune('void-common', 'Void', 'common').castEffectRefs).toEqual([
      { effectId: 'cast.damageConditional', params: { amount: 25, threshold: 2, conditionType: 'Void' } },
    ]);
    expect(createRune('wind-common', 'Wind', 'common').castEffectRefs).toEqual([
      { effectId: 'cast.fortune', params: { amount: 10 } },
    ]);
    expect(createRune('lightning-common', 'Lightning', 'common')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [
        { effectId: 'passive.damageBoostSynergy', params: { percent: 5, synergyType: 'Frost' } },
      ],
    });
  });

  it('creates draft refs by rarity without storing rarity in params', () => {
    const refs = getRuneCastEffectRefsForType('Frost', 'rare');

    expect(refs).toEqual([{ effectId: 'cast.armorSynergy', params: { amount: 10, synergyType: 'Frost' } }]);
    expect(refs[0]?.params).not.toHaveProperty('rarity');
  });

  it('renders rune descriptions from catalog refs', () => {
    const rune = createRune('void-epic', 'Void', 'epic');

    expect(getRuneEffectDescription(rune)).toBe('• Deal 15 damage for every Void rune in your completed wall');
  });
});
