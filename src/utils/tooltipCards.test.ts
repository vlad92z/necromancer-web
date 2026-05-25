/**
 * Unit tests for tooltip card builders.
 */

import { describe, expect, it } from 'vitest';
import { createRuneFromPool } from './runeEffects';
import { buildArtefactTooltipCards, buildRuneTooltipCards } from './tooltipCards';

describe('tooltipCards', () => {
  it('uses catalog-backed passive refs for artefact tooltip text', () => {
    const cards = buildArtefactTooltipCards(['ring', 'tome'], 'tome');

    expect(cards[0]).toMatchObject({
      title: 'Primer of Solitude',
      description: '+1 damage on all casts',
    });
    expect(cards[1]).toMatchObject({
      title: 'Signet of Fortune',
      description: '',
    });
  });

  it('uses shared rune descriptions for rarity requirement text in rune tooltip cards', () => {
    const commonRune = createRuneFromPool({ id: 'fire-common', runeType: 'Fire', rarity: 'common', random: () => 0 });
    const rareRune = createRuneFromPool({ id: 'void-rare', runeType: 'Void', rarity: 'rare', random: () => 0 });

    const cards = buildRuneTooltipCards([commonRune, rareRune], rareRune.id);

    expect(cards[0]).toMatchObject({
      runeType: 'Void',
      runeRarity: 'rare',
    });
    expect(cards[0]?.description).toContain('Requires 2 charges');
    expect(cards[1]?.description).not.toContain('Requires');
  });
});
