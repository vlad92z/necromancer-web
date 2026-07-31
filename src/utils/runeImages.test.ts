import { describe, expect, it } from 'vitest';
import type { RuneType } from '../types/game';
import { createRuneFromPool } from './runeEffects';
import { CURRENT_RUNE_IMAGE_SOURCES } from './runeImages';

const RUNE_TYPES: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind', 'Lightning'];
const EXPECTED_CARD_FILENAMES: Record<RuneType, string> = {
  Fire: 'card_fireball.png',
  Frost: 'card_frost_shield.png',
  Life: 'card_heal.png',
  Void: 'card_void_tendrils.png',
  Wind: 'card_tornado.png',
  Lightning: 'card_lightning_bolt.png',
};

describe('runeImages', () => {
  it.each(RUNE_TYPES)('assigns the requested card and token images to current %s cards', (runeType) => {
    const sources = CURRENT_RUNE_IMAGE_SOURCES[runeType];

    expect(sources.cardImageSrc).toContain(EXPECTED_CARD_FILENAMES[runeType]);
    expect(sources.tokenImageSrc).toContain(`token_${runeType.toLowerCase()}.png`);
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

    expect(rune).toMatchObject(CURRENT_RUNE_IMAGE_SOURCES.Frost);
  });
});
