import { describe, expect, it } from 'vitest';
import type { RuneEffectRarity, RuneType } from '../types/game';
import { createRuneFromPool } from './runeEffects';
import { CURRENT_RUNE_IMAGE_SOURCES } from './runeImages';

const RUNE_TYPES: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind', 'Lightning'];
const RARITIES: RuneEffectRarity[] = ['common', 'uncommon', 'rare', 'epic'];
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

  it.each(RUNE_TYPES)('uses the same current %s card image across all rarities', (runeType) => {
    const cardImages = RARITIES.map((rarity) => (
      createRuneFromPool({ id: `${runeType}-${rarity}`, runeType, rarity }).cardImageSrc
    ));

    expect(new Set(cardImages).size).toBe(1);
  });

  it('stores both resolved image values on created cards', () => {
    const rune = createRuneFromPool({ id: 'frost-rare', runeType: 'Frost', rarity: 'rare' });

    expect(rune).toMatchObject(CURRENT_RUNE_IMAGE_SOURCES.Frost);
  });
});
