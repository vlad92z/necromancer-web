/**
 * Unit tests for tooltip card builders.
 */

import { describe, expect, it } from 'vitest';
import { buildArtefactTooltipCards } from './tooltipCards';

describe('tooltipCards', () => {
  it('uses catalog-backed passive refs for artefact tooltip text', () => {
    const cards = buildArtefactTooltipCards(['ring', 'tome'], 'tome');

    expect(cards[0]).toMatchObject({
      title: 'Primer of Solitude',
      description: '+1 damage on all casts',
    });
    expect(cards[1]?.description).toContain('Double the odds');
  });
});
