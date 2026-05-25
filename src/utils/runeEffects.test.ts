/**
 * Unit tests for rune effect ref helpers.
 */

import { describe, expect, it } from 'vitest';
import type { EffectRef, RuneEffectRarity, RuneType } from '../types/game';
import { createRuneFromPool, getRuneEffectDescription, PREDEFINED_RUNE_VARIANTS } from './runeEffects';

const expectedRuneMatrix: Record<RuneEffectRarity, Record<RuneType, {
  castEffectRefs: EffectRef[];
  passiveEffectRefs: EffectRef[];
}>> = {
  common: {
    Fire: {
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
      passiveEffectRefs: [],
    },
    Frost: {
      castEffectRefs: [{ effectId: 'cast.armor', params: { amount: 3 } }],
      passiveEffectRefs: [],
    },
    Life: {
      castEffectRefs: [{ effectId: 'cast.healing', params: { amount: 2 } }],
      passiveEffectRefs: [],
    },
    Void: {
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
      passiveEffectRefs: [],
    },
    Wind: {
      castEffectRefs: [{ effectId: 'cast.draw', params: { amount: 1 } }],
      passiveEffectRefs: [],
    },
    Lightning: {
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
      passiveEffectRefs: [],
    },
  },
  uncommon: {
    Fire: {
      castEffectRefs: [{ effectId: 'cast.damageAdjacent', params: { amount: 1 } }],
      passiveEffectRefs: [],
    },
    Frost: {
      castEffectRefs: [{ effectId: 'cast.armorAdjacent', params: { amount: 3 } }],
      passiveEffectRefs: [],
    },
    Life: {
      castEffectRefs: [{ effectId: 'cast.healthIncrease', params: { amount: 2 } }],
      passiveEffectRefs: [],
    },
    Void: {
      castEffectRefs: [{ effectId: 'cast.damageConsuming', params: { amount: 2 } }],
      passiveEffectRefs: [],
    },
    Wind: {
      castEffectRefs: [{ effectId: 'cast.drawAdjacent' }],
      passiveEffectRefs: [],
    },
    Lightning: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.adjacentDamageBoost', params: { amount: 1 } }],
    },
  },
  rare: {
    Fire: {
      castEffectRefs: [{ effectId: 'cast.damageFragile', params: { amount: 15, reduction: 3, fragileType: 'Frost' } }],
      passiveEffectRefs: [],
    },
    Frost: {
      castEffectRefs: [{ effectId: 'cast.armorSynergy', params: { amount: 6, synergyType: 'Frost' } }],
      passiveEffectRefs: [],
    },
    Life: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.healingStartTurnSynergy', params: { amount: 1, synergyType: 'Life' } }],
    },
    Void: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.pulseSynergy', params: { amount: 1, synergyType: 'Void' } }],
    },
    Wind: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.drawingStartTurn', params: { amount: 1 } }],
    },
    Lightning: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.explosive', params: { amount: 30 } }],
    },
  },
  epic: {
    Fire: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.addDamage', params: { amount: 6, runeType: 'Fire' } }],
    },
    Frost: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.armorBoost', params: { amount: 10 } }],
    },
    Life: {
      castEffectRefs: [{ effectId: 'cast.healSynergy', params: { amount: 3, synergyType: 'Life' } }],
      passiveEffectRefs: [],
    },
    Void: {
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.vampire', params: { percent: 50 } }],
    },
    Wind: {
      castEffectRefs: [{ effectId: 'cast.returnAdjacent' }],
      passiveEffectRefs: [],
    },
    Lightning: {
      castEffectRefs: [{ effectId: 'cast.retriggerAdjacent' }],
      passiveEffectRefs: [],
    },
  },
};

describe('runeEffects', () => {
  it('maps the full final rune identity matrix exactly', () => {
    Object.entries(expectedRuneMatrix).forEach(([rarity, runeTypeMap]) => {
      Object.entries(runeTypeMap).forEach(([runeType, expectedRefs]) => {
        expect(createRune(`${runeType}-${rarity}`, runeType as RuneType, rarity as RuneEffectRarity)).toMatchObject(expectedRefs);
      });
    });
  });

  it('creates common runes with Stage 1 identity refs and direct rarity', () => {
    const rune = createRune('fire-common', 'Fire', 'common');

    expect(rune).toMatchObject({
      id: 'fire-common',
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
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
      { effectId: 'cast.damage', params: { amount: 1 } },
    ]);
    expect(createRune('wind-common', 'Wind', 'common').castEffectRefs).toEqual([
      { effectId: 'cast.draw', params: { amount: 1 } },
    ]);
    expect(createRune('lightning-common', 'Lightning', 'common')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 1 } }],
      passiveEffectRefs: [],
    });
  });

  it('creates draft refs by rarity without storing rarity in params', () => {
    const rune = createRune('frost-rare', 'Frost', 'rare');

    expect(rune.castEffectRefs).toEqual([{ effectId: 'cast.armorSynergy', params: { amount: 6, synergyType: 'Frost' } }]);
    expect(rune.castEffectRefs[0]?.params).not.toHaveProperty('rarity');
  });

  it('clones refs from predefined rune variants', () => {
    const first = createRune('fire-a', 'Fire', 'common');
    const second = createRune('fire-b', 'Fire', 'common');

    first.castEffectRefs[0].params = { amount: 99 };

    expect(second.castEffectRefs).toEqual([{ effectId: 'cast.damage', params: { amount: 1 } }]);
    expect(first.castEffectRefs).not.toBe(second.castEffectRefs);
  });

  it('throws when a predefined rune variant pool is empty', () => {
    const variants = PREDEFINED_RUNE_VARIANTS.Fire.common;
    PREDEFINED_RUNE_VARIANTS.Fire.common = [];

    try {
      expect(() => createRune('fire-common', 'Fire', 'common')).toThrow('No predefined rune variants for common Fire');
    } finally {
      PREDEFINED_RUNE_VARIANTS.Fire.common = variants;
    }
  });

  it('maps all uncommon rune identities to Stage 2 refs', () => {
    expect(createRune('fire-uncommon', 'Fire', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.damageAdjacent', params: { amount: 1 } }],
      passiveEffectRefs: [],
    });
    expect(createRune('frost-uncommon', 'Frost', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.armorAdjacent', params: { amount: 3 } }],
      passiveEffectRefs: [],
    });
    expect(createRune('life-uncommon', 'Life', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.healthIncrease', params: { amount: 2 } }],
      passiveEffectRefs: [],
    });
    expect(createRune('wind-uncommon', 'Wind', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.drawAdjacent' }],
      passiveEffectRefs: [],
    });
    expect(createRune('lightning-uncommon', 'Lightning', 'uncommon')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [
        { effectId: 'passive.adjacentDamageBoost', params: { amount: 1 } },
      ],
    });
    expect(createRune('void-uncommon', 'Void', 'uncommon')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.damageConsuming', params: { amount: 2 } }],
      passiveEffectRefs: [],
    });
  });

  it('maps all rare rune identities to Stage 3 refs', () => {
    expect(createRune('fire-rare', 'Fire', 'rare')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.damageFragile', params: { amount: 15, reduction: 3, fragileType: 'Frost' } }],
      passiveEffectRefs: [],
    });
    expect(createRune('frost-rare', 'Frost', 'rare')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.armorSynergy', params: { amount: 6, synergyType: 'Frost' } }],
      passiveEffectRefs: [],
    });
    expect(createRune('life-rare', 'Life', 'rare')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.healingStartTurnSynergy', params: { amount: 1, synergyType: 'Life' } }],
    });
    expect(createRune('lightning-rare', 'Lightning', 'rare')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.explosive', params: { amount: 30 } }],
    });
    expect(createRune('void-rare', 'Void', 'rare')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.pulseSynergy', params: { amount: 1, synergyType: 'Void' } }],
    });
    expect(createRune('wind-rare', 'Wind', 'rare')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.drawingStartTurn', params: { amount: 1 } }],
    });
  });

  it('maps all epic rune identities to Stage 4 refs', () => {
    expect(createRune('fire-epic', 'Fire', 'epic')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.addDamage', params: { amount: 6, runeType: 'Fire' } }],
    });
    expect(createRune('frost-epic', 'Frost', 'epic')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.armorBoost', params: { amount: 10 } }],
    });
    expect(createRune('life-epic', 'Life', 'epic')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.healSynergy', params: { amount: 3, synergyType: 'Life' } }],
      passiveEffectRefs: [],
    });
    expect(createRune('lightning-epic', 'Lightning', 'epic')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.retriggerAdjacent' }],
      passiveEffectRefs: [],
    });
    expect(createRune('void-epic', 'Void', 'epic')).toMatchObject({
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.vampire', params: { percent: 50 } }],
    });
    expect(createRune('wind-epic', 'Wind', 'epic')).toMatchObject({
      castEffectRefs: [{ effectId: 'cast.returnAdjacent' }],
      passiveEffectRefs: [],
    });
  });

  it('renders rune descriptions from catalog refs', () => {
    const rune = createRune('void-epic', 'Void', 'epic');

    expect(getRuneEffectDescription(rune)).toBe('• Heal 50% of damage dealt');
  });

  it('renders mixed and passive-only rune descriptions from catalog refs', () => {
    expect(getRuneEffectDescription(createRune('life-epic', 'Life', 'epic'))).toBe(
      '• Heal 3 for every Life rune in your completed wall'
    );
    expect(getRuneEffectDescription(createRune('fire-epic', 'Fire', 'epic'))).toBe(
      '• Fire runes deal +6 damage'
    );
  });
});

function createRune(id: string, runeType: RuneType, rarity: RuneEffectRarity) {
  return createRuneFromPool({ id, runeType, rarity, random: () => 0 });
}
