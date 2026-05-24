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

    expect(refs).toEqual([{ effectId: 'cast.armorSynergy', params: { amount: 5, synergyType: 'Frost' } }]);
    expect(refs[0]?.params).not.toHaveProperty('rarity');
  });

  it('maps all uncommon rune identities to Stage 2 refs', () => {
    expect(createRune('fire-uncommon', 'Fire', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.synergy', params: { amount: 5, synergyType: 'Fire' } }],
      passiveEffectRefs: [],
    });
    expect(createRune('frost-uncommon', 'Frost', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.armorAdjacent', params: { amount: 3 } }],
      passiveEffectRefs: [],
    });
    expect(createRune('life-uncommon', 'Life', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.healthIncrease', params: { amount: 1 } }],
      passiveEffectRefs: [],
    });
    expect(createRune('wind-uncommon', 'Wind', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.drawAdjacent' }],
      passiveEffectRefs: [],
    });
    expect(createRune('lightning-uncommon', 'Lightning', 'uncommon')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [
        { effectId: 'passive.damageBoostSynergy', params: { percent: 15, synergyType: 'Lightning' } },
      ],
    });
    expect(createRune('void-uncommon', 'Void', 'uncommon')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [
        { effectId: 'passive.pulseSynergy', params: { amount: 5, synergyType: 'Void' } },
      ],
    });
  });

  it('maps all rare rune identities to Stage 3 refs', () => {
    expect(createRune('fire-rare', 'Fire', 'rare')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.damageFragile', params: { amount: 25, reduction: 5, fragileType: 'Frost' } }],
      passiveEffectRefs: [],
    });
    expect(createRune('frost-rare', 'Frost', 'rare')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.armorSynergy', params: { amount: 5, synergyType: 'Frost' } }],
      passiveEffectRefs: [],
    });
    expect(createRune('life-rare', 'Life', 'rare')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.healingStartTurn', params: { amount: 2 } }],
    });
    expect(createRune('lightning-rare', 'Lightning', 'rare')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.retriggerAdjacent' }],
      passiveEffectRefs: [],
    });
    expect(createRune('void-rare', 'Void', 'rare')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.damageConsuming', params: { amount: 10 } }],
      passiveEffectRefs: [],
    });
    expect(createRune('wind-rare', 'Wind', 'rare')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.drawingStartTurn', params: { amount: 1 } }],
    });
  });

  it('renders rune descriptions from catalog refs', () => {
    const rune = createRune('void-epic', 'Void', 'epic');

    expect(getRuneEffectDescription(rune)).toBe('• Deal 15 damage for every Void rune in your completed wall');
  });
});
