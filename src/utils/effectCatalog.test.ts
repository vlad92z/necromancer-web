/**
 * Unit tests for effect catalog display metadata.
 */

import { describe, expect, it } from 'vitest';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from './artefactDescriptions';
import { createEffectRef, EFFECT_CATALOG, getEffectDescription } from './effectCatalog';
import { createRuneRemovalEffectRef } from './runeRemoval';
import { CARD_DEFINITIONS } from './cardCatalog';

describe('effectCatalog', () => {
  it('marks Explosive as an on-removal trigger', () => {
    expect(EFFECT_CATALOG['passive.explosive'].passive?.trigger).toBe('onRuneRemoved');
  });

  it('defines the current Firebolt, Lightning Bolt, Void Tendrils, and Tornado contracts', () => {
    expect(CARD_DEFINITIONS.Firebolt).toMatchObject({
      manaCost: 1,
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 2 } }],
    });
    expect(CARD_DEFINITIONS.LightningBolt).toMatchObject({
      manaCost: 2,
      castEffectRefs: [],
      passiveEffectRefs: [{ effectId: 'passive.explosive', params: { amount: 7 } }],
    });
    expect(CARD_DEFINITIONS.VoidTendrils).toMatchObject({
      manaCost: 2,
      castEffectRefs: [{
        effectId: 'rune.consume',
        trigger: 'onCast',
        selection: 'manual',
        payload: { effectId: 'cast.damage', params: { amount: 5 } },
      }],
    });
    expect(CARD_DEFINITIONS.Tornado).toMatchObject({
      manaCost: 5,
      castEffectRefs: [{ effectId: 'cast.damage', params: { amount: 10 } }],
    });
    expect(CARD_DEFINITIONS.Hide).toMatchObject({
      manaCost: 0,
      castEffectRefs: [{
        effectId: 'rune.consume',
        trigger: 'onCast',
        selection: 'manual',
        payload: { effectId: 'cast.shield', params: { amount: 3 } },
      }],
    });
    expect(CARD_DEFINITIONS.FrostShield).toMatchObject({
      manaCost: 2,
      castEffectRefs: [{ effectId: 'cast.shield', params: { amount: 3 } }],
    });
  });

  it('defines Shadow Bolt as a two-mana Void-wall synergy spell', () => {
    expect(CARD_DEFINITIONS.ShadowBolt).toMatchObject({
      runeTypes: ['Void'],
      manaCost: 2,
      cardImageSrc: expect.stringContaining('card_shadow_bolt.png'),
      castEffectRefs: [{ effectId: 'cast.synergy', params: { amount: 2, synergyType: 'Void' } }],
    });
  });

  it('defines Amplify Magic as a three-mana Frost damage boost', () => {
    expect(CARD_DEFINITIONS.AmplifyMagic).toMatchObject({
      runeTypes: ['Frost'],
      manaCost: 3,
      cardImageSrc: expect.stringContaining('card_amplify_magic.png'),
      passiveEffectRefs: [{ effectId: 'passive.damageBoost', params: { amount: 1 } }],
    });
  });

  it('renders cast effect descriptions from refs', () => {
    expect(getEffectDescription(createEffectRef('cast.damage', { amount: 3 }))).toBe('Deal 3 damage');
    expect(getEffectDescription(createEffectRef('cast.damageAdjacent', { amount: 1 }))).toBe(
      'Deal 1 damage for every adjacent rune'
    );
    expect(getEffectDescription(createEffectRef('cast.consumeAdjacent', { amount: 1 }))).toBe(
      'Consume adjacent runes, deal 1 damage for each rune consumed'
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
    expect(getEffectDescription(createRuneRemovalEffectRef({
      kind: 'consume',
      trigger: 'onCast',
      selection: 'random',
      runeType: 'Fire',
      payload: createEffectRef('cast.damage', { amount: 5 }),
    }))).toBe('Consume a random Fire Rune to deal 5 damage');
    expect(getEffectDescription(createRuneRemovalEffectRef({
      kind: 'destroy',
      trigger: 'onCast',
      selection: 'manual',
    }))).toBe('Destroy 1 Enemy Rune');
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
    expect(getEffectDescription(createEffectRef('cast.shieldAdjacent', { amount: 3 }))).toBe(
      'Shield 3 for every adjacent rune'
    );
    expect(getEffectDescription(createEffectRef('cast.healthIncrease', { amount: 1 }))).toBe('Increase maximum health by 1');
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
    expect(getEffectDescription(createEffectRef('cast.synergy', { amount: 2, synergyType: 'Void' }))).toBe(
      'Deal 2 damage for every Void rune in your completed wall'
    );
    expect(getEffectDescription(createEffectRef('cast.shieldSynergy', { amount: 5, synergyType: 'Frost' }))).toBe(
      'Shield 5 for every Frost rune in your completed wall'
    );
    expect(getEffectDescription(createEffectRef('passive.damageBoostSynergy', {
      percent: 5,
      synergyType: 'Frost',
    }))).toBe('Increase all damage by 5% for every Frost rune in your completed wall, including the triggering rune if it matches');
    expect(getEffectDescription(createEffectRef('passive.damageBoost', { amount: 1 }))).toBe(
      'Increase all damage by 1'
    );
    expect(getEffectDescription(createEffectRef('passive.adjacentDamageBoost', { amount: 1 }))).toBe(
      'Adjacent runes deal +1 damage'
    );
    expect(getEffectDescription(createEffectRef('passive.pulseSynergy', {
      amount: 5,
      synergyType: 'Void',
    }))).toBe('At end of turn, deal 5 damage for every Void rune in your completed wall');
    expect(getEffectDescription(createEffectRef('passive.shieldEndTurnSynergy', {
      amount: 2,
      synergyType: 'Frost',
    }))).toBe('At end of turn, Shield 2 for every Frost rune in your completed wall');
    expect(getEffectDescription(createEffectRef('passive.healingStartTurn', { amount: 2 }))).toBe(
      'At start of turn, heal 2'
    );
    expect(getEffectDescription(createEffectRef('passive.healingStartTurnSynergy', {
      amount: 1,
      synergyType: 'Life',
    }))).toBe('At start of turn, heal 1 for every Life rune in your completed wall');
    expect(getEffectDescription(createEffectRef('passive.drawingStartTurn', { amount: 1 }))).toBe(
      'At start of turn, draw 1 additional runes'
    );
    expect(getEffectDescription(createEffectRef('passive.addDamage', { amount: 5, runeType: 'Fire' }))).toBe(
      'Fire runes deal +5 damage'
    );
    expect(getEffectDescription(createEffectRef('passive.shieldBoost', { amount: 5 }))).toBe(
      'Increase all shield gained by 5'
    );
    expect(getEffectDescription(createEffectRef('passive.explosive', { amount: 50 }))).toBe(
      'Deal 50 damage when consumed, destroyed, or transformed'
    );
    expect(getEffectDescription(createEffectRef('passive.vampire', { percent: 50 }))).toBe(
      'Heal 50% of damage dealt'
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
    expect(ARTEFACTS.ring.passiveEffectRefs[0]).toMatchObject({ effectId: 'passive.ringManaStartTurn', params: { amount: 1 } });
    expect(ARTEFACTS.robe.passiveEffectRefs).toEqual([]);
    expect(ARTEFACTS.rod.passiveEffectRefs[0]?.effectId).toBe('passive.rodHealing');
    expect(ARTEFACTS.potion.passiveEffectRefs[0]?.effectId).toBe('passive.potionShield');
    expect(ARTEFACTS.tome.passiveEffectRefs[0]?.effectId).toBe('passive.tomeCastDamage');

    expect(getArtefactEffectDescription('ring')).toBe('At start of turn, gain 1 mana');
    expect(getArtefactEffectDescription('tome')).toBe('+1 damage on all casts');
  });
});
