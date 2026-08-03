import { describe, expect, it } from 'vitest';
import { getRegionDefinition, getRegionEventToken } from './regionCatalog';

describe('regionCatalog', () => {
  it('defines Greenwood with six Goblins, six Witches, six Shades, three Healing Shrines, three Sacrificial Altars, and one Artefact', () => {
    const greenwood = getRegionDefinition('greenwood');
    const combatTokens = greenwood.eventTokens.filter((token) => token.kind === 'combat');
    const goblins = combatTokens.filter((token) => token.monsterId === 'goblin');
    const witches = combatTokens.filter((token) => token.monsterId === 'witch');
    const shades = combatTokens.filter((token) => token.monsterId === 'shade');
    const shrines = greenwood.eventTokens.filter((token) => token.kind === 'healing');
    const altars = greenwood.eventTokens.filter((token) => token.kind === 'sacrificial-altar');
    const artefacts = greenwood.eventTokens.filter((token) => token.kind === 'artefact');

    expect(combatTokens).toHaveLength(18);
    expect(goblins).toHaveLength(6);
    expect(witches).toHaveLength(6);
    expect(shades).toHaveLength(6);
    expect(shades.every((token) => token.unvisitedImageSrc.includes('shade.png'))).toBe(true);
    expect(shrines).toHaveLength(3);
    expect(shrines.every((token) => token.healingPercent === 25)).toBe(true);
    expect(altars).toHaveLength(3);
    expect(altars.every((token) => token.unvisitedImageSrc.includes('sacrificial_altar.png'))).toBe(true);
    expect(altars.every((token) => token.visitedImageSrc.includes('sacrificial_altar_visited.png'))).toBe(true);
    expect(artefacts).toHaveLength(1);
    expect(artefacts[0]).toMatchObject({ artefactPool: ['ring'], arcaneDustRewardRange: [15, 27] });
    expect(artefacts[0]?.unvisitedImageSrc).toContain('artifact.png');
    expect(artefacts[0]?.visitedImageSrc).toContain('artifact_visited.png');
    expect(greenwood.bossMonsterIds).toEqual(['golem-lord']);
    expect([...goblins, ...witches, ...shades].every((token) => token.visitedImageSrc.includes('token_visited.png'))).toBe(true);
  });

  it('looks up event artwork by token id', () => {
    const shrine = getRegionDefinition('greenwood').eventTokens.find((token) => token.kind === 'healing')!;

    expect(getRegionEventToken(shrine.id)).toBe(shrine);
    expect(getRegionEventToken(null)).toBeNull();
  });
});
