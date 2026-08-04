import { describe, expect, it } from 'vitest';
import { CARD_DEFINITIONS } from './cardCatalog';
import { createRuneFromPool } from './runeEffects';

describe('cardCatalog artwork', () => {
  it('defines card and token artwork on every card entry', () => {
    Object.values(CARD_DEFINITIONS).forEach((card) => {
      expect(card.cardImageSrc).toContain('card_');
      expect(card.tokenImageSrc).toContain('token_');
    });
  });

  it('defines the void orb animation on every card, playing forward then back to frame one', () => {
    Object.values(CARD_DEFINITIONS).forEach((card) => {
      expect(card.spellAnimation.frames.map((frame) => frame.match(/orb_void_(\d)\.png/)?.[1]))
        .toEqual(['1', '2', '3', '4', '5', '6', '7', '6', '5', '4', '3', '2', '1']);
      expect(card.spellAnimation.frameDurationMs).toBeGreaterThan(0);
    });
  });

  it('uses card-specific artwork for Barricade and Headwind', () => {
    expect(createRuneFromPool({
      id: 'life-common',
      runeType: 'Life',
      rarity: 'common',
    }).cardImageSrc).toContain('card_barricade.png');
    expect(createRuneFromPool({
      id: 'wind-uncommon',
      runeType: 'Wind',
      rarity: 'uncommon',
    }).cardImageSrc).toContain('card_headwind.png');
  });

  it('stores both resolved image values on created cards', () => {
    const rune = createRuneFromPool({ id: 'frost-rare', runeType: 'Frost', rarity: 'rare' });

    expect(rune).toMatchObject({
      cardImageSrc: CARD_DEFINITIONS.FrostShield.cardImageSrc,
      tokenImageSrc: CARD_DEFINITIONS.FrostShield.tokenImageSrc,
      spellAnimation: CARD_DEFINITIONS.FrostShield.spellAnimation,
    });
  });
});
