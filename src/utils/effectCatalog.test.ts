/**
 * Unit tests for effect catalog display metadata.
 */

import { describe, expect, it } from 'vitest';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from './artefactDescriptions';
import { createEffectRef, getEffectDescription } from './effectCatalog';

describe('effectCatalog', () => {
  it('renders cast effect descriptions from refs', () => {
    expect(getEffectDescription(createEffectRef('cast.damage', { amount: 3 }))).toBe('Deal 3 damage');
    expect(getEffectDescription(createEffectRef('cast.damageAdjacent', { amount: 1 }))).toBe(
      'Deal 1 damage for every adjacent rune'
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
      'Deal 10 damage for every adjacent rune, then destroy them'
    );
    expect(getEffectDescription(createEffectRef('cast.destroyType', { targetType: 'Fire' }))).toBe(
      'Destroy a random completed Fire rune'
    );
    expect(getEffectDescription(createEffectRef('cast.convertRandom', { sourceType: 'Fire', targetType: 'Frost' }))).toBe(
      'Convert a random completed Fire rune into a common Frost rune with no effects'
    );
    expect(getEffectDescription(createEffectRef('cast.convertAdjacent', { targetType: 'Void' }))).toBe(
      'Convert adjacent runes into Void runes'
    );
    expect(getEffectDescription(createEffectRef('cast.retriggerAdjacent'))).toBe('Retrigger adjacent runes');
    expect(getEffectDescription(createEffectRef('cast.retriggerType', { targetType: 'Life' }))).toBe(
      'Retrigger all Life runes'
    );
    expect(getEffectDescription(createEffectRef('cast.armorAdjacent', { amount: 3 }))).toBe(
      'Gain 3 armor for every adjacent rune'
    );
    expect(getEffectDescription(createEffectRef('cast.healthIncrease', { amount: 1 }))).toBe(
      'Increase maximum health by 1 and heal 1'
    );
    expect(getEffectDescription(createEffectRef('cast.healthDecrease', { amount: 2 }))).toBe(
      'Reduce maximum health by 2'
    );
    expect(getEffectDescription(createEffectRef('cast.draw', { amount: 1 }))).toBe('Draw 1 rune');
    expect(getEffectDescription(createEffectRef('cast.drawType', { amount: 1, targetType: 'Fire' }))).toBe(
      'Draw 1 Fire rune'
    );
    expect(getEffectDescription(createEffectRef('cast.drawAdjacent'))).toBe(
      'Draw one rune for every adjacent rune'
    );
    expect(getEffectDescription(createEffectRef('cast.healSynergy', { amount: 3, synergyType: 'Life' }))).toBe(
      'Heal 3 for every Life rune in your completed wall'
    );
    expect(getEffectDescription(createEffectRef('cast.returnAdjacent'))).toBe('Return adjacent runes to your hand');
    expect(getEffectDescription(createEffectRef('cast.arcaneDustAdjacent', { amount: 5 }))).toBe(
      'Gain 5 arcane dust for every adjacent rune'
    );
    expect(getEffectDescription(createEffectRef('cast.chargeAdjacent'))).toBe('Charge adjacent rune slots by 1');
    expect(getEffectDescription(createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' }))).toBe(
      'Deal 2 damage for every Void rune in your completed wall'
    );
    expect(getEffectDescription(createEffectRef('cast.armorSynergy', { amount: 5, synergyType: 'Frost' }))).toBe(
      'Gain 5 armor for every Frost rune in your completed wall'
    );
    expect(getEffectDescription(createEffectRef('passive.damageBoostSynergy', {
      percent: 5,
      synergyType: 'Frost',
    }))).toBe('Increase all damage by 5% for every Frost rune in your completed wall, including the triggering rune if it matches');
    expect(getEffectDescription(createEffectRef('passive.damageBoost', { amount: 1 }))).toBe(
      'Increase all damage by 1'
    );
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
    expect(getEffectDescription(createEffectRef('passive.addDamage', { amount: 5, runeType: 'Fire' }))).toBe(
      'Fire runes deal +5 damage'
    );
    expect(getEffectDescription(createEffectRef('passive.armorBoost', { amount: 5 }))).toBe(
      'Increase all armor gained by 5'
    );
    expect(getEffectDescription(createEffectRef('passive.explosive', { amount: 50 }))).toBe(
      'Deal 50 damage if destroyed or transformed'
    );
    expect(getEffectDescription(createEffectRef('passive.vampire', { percent: 25 }))).toBe(
      'Heal 25% of damage dealt'
    );
    expect(getEffectDescription(createEffectRef('passive.reduceDamage', { amount: 3 }))).toBe(
      'Reduce incoming damage by 3'
    );
  });

  it('keeps rarity out of effect ref params', () => {
    const ref = createEffectRef('cast.damage', { amount: 3 });

    expect(ref.params).toEqual({ amount: 3 });
    expect(ref.params).not.toHaveProperty('rarity');
  });

  it('defines artefact passive refs and catalog descriptions', () => {
    expect(ARTEFACTS.ring.passiveEffectRefs).toEqual([]);
    expect(ARTEFACTS.robe.passiveEffectRefs).toEqual([]);
    expect(ARTEFACTS.rod.passiveEffectRefs[0]?.effectId).toBe('passive.rodHealing');
    expect(ARTEFACTS.potion.passiveEffectRefs[0]?.effectId).toBe('passive.potionArmor');
    expect(ARTEFACTS.tome.passiveEffectRefs[0]?.effectId).toBe('passive.tomeCastDamage');

    expect(getArtefactEffectDescription('ring')).toBe('');
    expect(getArtefactEffectDescription('tome')).toBe('+1 damage on all casts');
  });
});
