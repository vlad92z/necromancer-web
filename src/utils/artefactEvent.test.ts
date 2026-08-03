import { describe, expect, it } from 'vitest';
import type { SoloMapState } from '../types/game';
import { resolveArtefactEvent } from './artefactEvent';
import { resolveStartTurnEffects } from './effectResolver';
import { createEmptySpellWall } from './spellWall';
import { createPlayer } from './soloRunFactory';

function createMap(): SoloMapState {
  return {
    regionId: 'greenwood',
    availableEventTokenIds: [],
    tiles: {
      'artefact-tile': {
        key: 'artefact-tile', x: 0, y: 0, kind: 'forest',
        events: {
          A: {
            id: 'artefact-tile:A', locationId: 'A', tokenId: 'greenwood-artefact-1', kind: 'artefact',
            offeredArtefactId: 'ring', arcaneDustReward: 21, cleared: false,
          },
        },
      },
    },
    playerPosition: { tileKey: 'artefact-tile', locationId: 'A' },
    activeEncounter: null,
  };
}

describe('resolveArtefactEvent', () => {
  it('claims its offered run-scoped artefact and Arcane Dust, then clears the event', () => {
    const result = resolveArtefactEvent({ soloMap: createMap(), activeArtefacts: [], arcaneDust: 4 }, true);

    expect(result).toMatchObject({ status: 'claimed', activeArtefacts: ['ring'], arcaneDust: 25 });
    expect(result.soloMap.tiles['artefact-tile']?.events.A?.cleared).toBe(true);
  });

  it('can be skipped without granting a reward', () => {
    const result = resolveArtefactEvent({ soloMap: createMap(), activeArtefacts: [], arcaneDust: 4 }, false);

    expect(result).toMatchObject({ status: 'skipped', activeArtefacts: [], arcaneDust: 4 });
    expect(result.soloMap.tiles['artefact-tile']?.events.A?.cleared).toBe(true);
  });
});

describe('Ring of Mana', () => {
  it('adds one mana at the start of every turn without permanently raising the base maximum', () => {
    const player = createPlayer('player', 'Player', 30, [], 30);
    const result = resolveStartTurnEffects({
      player,
      wall: createEmptySpellWall(),
      activeArtefacts: ['ring'],
    });

    expect(result.player).toMatchObject({ mana: 6, maxMana: 5 });
  });
});
