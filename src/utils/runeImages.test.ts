import { describe, expect, it } from 'vitest';
import type { RuneEffectRarity, RuneType } from '../types/game';
import { createRuneFromPool } from './runeEffects';
import { getRuneImageSources } from './runeImages';

const RUNE_TYPES: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind', 'Lightning'];
const RARITIES: RuneEffectRarity[] = ['common', 'uncommon', 'rare', 'epic'];

describe('runeImages', () => {
  it.each(RUNE_TYPES)('uses one type-specific token image for every %s rarity', (runeType) => {
    const sources = RARITIES.map((rarity) => getRuneImageSources(runeType, rarity));

    expect(new Set(sources.map(({ tokenImageSrc }) => tokenImageSrc)).size).toBe(1);
    expect(sources[0]?.tokenImageSrc).toContain(`token_${runeType.toLowerCase()}.png`);
  });

  it.each(RUNE_TYPES)('keeps rarity-specific %s card images', (runeType) => {
    const cardImages = RARITIES.map((rarity) => getRuneImageSources(runeType, rarity).cardImageSrc);

    expect(new Set(cardImages).size).toBe(RARITIES.length);
  });

  it('stores both resolved image values on created cards', () => {
    const rune = createRuneFromPool({ id: 'frost-rare', runeType: 'Frost', rarity: 'rare' });

    expect(rune).toMatchObject(getRuneImageSources('Frost', 'rare'));
  });
});
