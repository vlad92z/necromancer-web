import { describe, expect, it } from 'vitest';
import { getRegionDefinition, getRegionEventToken } from './regionCatalog';

describe('regionCatalog', () => {
  it('defines Greenwood with twelve Goblins and two Healing Shrines', () => {
    const greenwood = getRegionDefinition('greenwood');
    const goblins = greenwood.eventTokens.filter((token) => token.kind === 'combat');
    const shrines = greenwood.eventTokens.filter((token) => token.kind === 'healing');

    expect(goblins).toHaveLength(12);
    expect(shrines).toHaveLength(2);
    expect(goblins.every((token) => token.monsterId === 'goblin')).toBe(true);
    expect(shrines.every((token) => token.healingPercent === 25)).toBe(true);
    expect([...goblins, ...shrines].every((token) => token.visitedImageSrc.includes('token_visited.png'))).toBe(true);
  });

  it('looks up event artwork by token id', () => {
    const shrine = getRegionDefinition('greenwood').eventTokens.find((token) => token.kind === 'healing')!;

    expect(getRegionEventToken(shrine.id)).toBe(shrine);
    expect(getRegionEventToken(null)).toBeNull();
  });
});
