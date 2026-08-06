import { describe, expect, it } from 'vitest';
import { CARD_DEFINITIONS } from './cardCatalog';
import { createRuneFromCardName } from './runeEffects';

describe('cardCatalog artwork', () => {
  it('defines card and token artwork on every card entry', () => {
    Object.values(CARD_DEFINITIONS).forEach((card) => {
      expect(card.cardImageSrc).toContain('card_');
      expect(card.tokenImageSrc).toContain('token_');
    });
  });

  it('defines a spell animation and sound on every card', () => {
    Object.values(CARD_DEFINITIONS).forEach((card) => {
      expect(card.spellAnimation.frames.length).toBeGreaterThan(0);
      expect(card.spellAnimation.frameDurationMs).toBeGreaterThan(0);
      expect(card.spellSound).toContain('.mp3');
    });
  });

  it('gives Barricade its stone sound and forward-and-back stone animation', () => {
    expect(CARD_DEFINITIONS.Barricade.spellSound).toContain('spell_stone.mp3');
    expect(CARD_DEFINITIONS.Barricade.spellAnimation.frames).toHaveLength(9);
    expect(CARD_DEFINITIONS.Barricade.spellAnimation.frames[0]).toBe(CARD_DEFINITIONS.Barricade.spellAnimation.frames[8]);
    expect(CARD_DEFINITIONS.Barricade.spellAnimation.frames[4]).not.toBe(CARD_DEFINITIONS.Barricade.spellAnimation.frames[0]);
  });

  it('uses card-specific artwork for Barricade and Headwind', () => {
    expect(createRuneFromCardName({ id: 'life-common', cardName: 'Barricade' }).cardImageSrc).toContain('card_barricade.png');
    expect(createRuneFromCardName({ id: 'wind-uncommon', cardName: 'Headwind' }).cardImageSrc).toContain('card_headwind.png');
  });

  it('stores both resolved image values on created cards', () => {
    const rune = createRuneFromCardName({ id: 'frost-common', cardName: 'FrostShield' });

    expect(rune).toMatchObject({
      cardImageSrc: CARD_DEFINITIONS.FrostShield.cardImageSrc,
      tokenImageSrc: CARD_DEFINITIONS.FrostShield.tokenImageSrc,
      spellAnimation: CARD_DEFINITIONS.FrostShield.spellAnimation,
      spellSound: CARD_DEFINITIONS.FrostShield.spellSound,
    });
  });
});
