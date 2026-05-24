/**
 * Unit tests for effect catalog display metadata.
 */

import { describe, expect, it } from 'vitest';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from './artefactDescriptions';
import { createEffectRef, getEffectDescription } from './effectCatalog';

describe('effectCatalog', () => {
  it('renders cast effect descriptions from refs', () => {
    expect(getEffectDescription(createEffectRef('cast.damage', { amount: 3 }))).toBe('Deal 3 damage on cast');
    expect(getEffectDescription(createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' }))).toBe(
      'Deal 2 damage for every Void rune in your completed wall'
    );
  });

  it('keeps rarity out of effect ref params', () => {
    const ref = createEffectRef('cast.damage', { amount: 3 });

    expect(ref.params).toEqual({ amount: 3 });
    expect(ref.params).not.toHaveProperty('rarity');
  });

  it('defines artefact passive refs and catalog descriptions', () => {
    expect(ARTEFACTS.ring.passiveEffectRefs[0]?.effectId).toBe('passive.ringDraftRarity');
    expect(ARTEFACTS.robe.passiveEffectRefs[0]?.effectId).toBe('passive.robeDraftSelection');
    expect(ARTEFACTS.rod.passiveEffectRefs[0]?.effectId).toBe('passive.rodHealing');
    expect(ARTEFACTS.potion.passiveEffectRefs[0]?.effectId).toBe('passive.potionArmor');
    expect(ARTEFACTS.tome.passiveEffectRefs[0]?.effectId).toBe('passive.tomeCastDamage');

    expect(getArtefactEffectDescription('ring')).toContain('Double the odds');
    expect(getArtefactEffectDescription('tome')).toBe('+1 damage on all casts');
  });
});
