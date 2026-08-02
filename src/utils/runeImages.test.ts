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
    });
  });
});
