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
    expect(getEffectDescription(createEffectRef('cast.damageAdjacent', { amount: 1 }))).toBe(
      'Deal 1 damage for every adjacent completed rune'
    );
    expect(getEffectDescription(createEffectRef('cast.damageConditional', {
      amount: 25,
      threshold: 2,
      conditionType: 'Void',
    }))).toBe('Deal 25 damage if at least 2 Void runes are in your completed wall');
    expect(getEffectDescription(createEffectRef('cast.damageFragile', {
      amount: 25,
      reduction: 5,
      fragileType: 'Frost',
    }))).toBe('Deal 25 damage, reduced by 5 for every Frost rune in your completed wall');
    expect(getEffectDescription(createEffectRef('cast.damageConsuming', { amount: 10 }))).toBe(
      'Deal 10 damage for every adjacent completed rune, then destroy them'
    );
    expect(getEffectDescription(createEffectRef('cast.retriggerAdjacent'))).toBe('Retrigger adjacent completed runes');
    expect(getEffectDescription(createEffectRef('cast.armorAdjacent', { amount: 3 }))).toBe(
      'Gain 3 armor for every adjacent completed rune'
    );
    expect(getEffectDescription(createEffectRef('cast.healthIncrease', { amount: 1 }))).toBe(
      'Increase maximum health by 1 and heal 1'
    );
    expect(getEffectDescription(createEffectRef('cast.drawAdjacent'))).toBe(
      'Draw one rune for every adjacent completed rune'
    );
    expect(getEffectDescription(createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' }))).toBe(
      'Deal 2 damage for every Void rune in your completed wall'
    );
    expect(getEffectDescription(createEffectRef('passive.damageBoostSynergy', {
      percent: 5,
      synergyType: 'Frost',
    }))).toBe('Increase all damage by 5% for every Frost rune in your completed wall');
    expect(getEffectDescription(createEffectRef('passive.pulseSynergy', {
      amount: 5,
      synergyType: 'Void',
    }))).toBe('At end of turn, deal 5 damage for every Void rune in your completed wall');
    expect(getEffectDescription(createEffectRef('passive.healingStartTurn', { amount: 2 }))).toBe(
      'At start of turn, heal 2'
    );
    expect(getEffectDescription(createEffectRef('passive.drawingStartTurn', { amount: 1 }))).toBe(
      'At start of turn, draw 1 additional runes'
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
