/**
 * Unit tests for tooltip card builders.
 */

import { describe, expect, it } from 'vitest';
import { createRuneFromPool } from './runeEffects';
import { buildRuneTooltipCards } from './tooltipCards';

describe('tooltipCards', () => {
  it('uses shared effect-only rune descriptions in tooltip cards', () => {
    const commonRune = createRuneFromPool({ id: 'fire-common', runeType: 'Fire', rarity: 'common', random: () => 0 });
    const rareRune = createRuneFromPool({ id: 'void-rare', runeType: 'Void', rarity: 'rare', random: () => 0 });

    const cards = buildRuneTooltipCards([commonRune, rareRune], rareRune.id);

    expect(cards[0]).toMatchObject({
      runeType: 'Void',
      runeTypes: ['Void'],
      title: rareRune.name,
      runeRarity: 'rare',
      imageSrc: rareRune.cardImageSrc,
    });
    expect(cards[0]?.description).not.toContain('Requires');
    expect(cards[1]?.description).not.toContain('Requires');
  });

  it('preserves every rune type for multi-type card presentation', () => {
    const rune = createRuneFromPool({ id: 'fire-wind', runeType: 'Fire', rarity: 'common', random: () => 0 });
    rune.runeTypes = ['Fire', 'Wind'];

    expect(buildRuneTooltipCards([rune])[0]?.runeTypes).toEqual(['Fire', 'Wind']);
  });
});
