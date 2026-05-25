/**
 * Unit tests for tooltip card builders.
 */

import { describe, expect, it } from 'vitest';
import { createRuneFromPool } from './runeEffects';
import { buildRuneTooltipCards } from './tooltipCards';

describe('tooltipCards', () => {
  it('uses shared rune descriptions for rarity requirement text in rune tooltip cards', () => {
    const commonRune = createRuneFromPool({ id: 'fire-common', runeType: 'Fire', rarity: 'common', random: () => 0 });
    const rareRune = createRuneFromPool({ id: 'void-rare', runeType: 'Void', rarity: 'rare', random: () => 0 });

    const cards = buildRuneTooltipCards([commonRune, rareRune], rareRune.id);

    expect(cards[0]).toMatchObject({
      runeType: 'Void',
      runeRarity: 'rare',
    });
    expect(cards[0]?.description).toContain('\n\n• Requires 2 charges');
    expect(cards[1]?.description).not.toContain('Requires');
  });
});
