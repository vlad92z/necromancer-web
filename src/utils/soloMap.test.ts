import { describe, expect, it } from 'vitest';
import type { MapLocationId, MapRoadId, MapTravelTarget } from '../types/game';
import {
  completeActiveMapEncounter,
  createForestMapTile,
  createMapTileKey,
  createMapTravelTargetKey,
  discoverSoloMapRoad,
  getFrontierRoadIds,
  getMapLocationMarkerKind,
  getReachableMapTargets,
  initializeSoloMap,
  MAP_ENCOUNTER_LOCATION_IDS,
  MAP_LOCATION_POINTS,
  MAP_ROAD_IDS,
  travelOnSoloMap,
} from './soloMap';
import { getRegionDefinition } from './regionCatalog';

function initializeCombatOnlyMap() {
  const map = initializeSoloMap();
  return {
    ...map,
    availableEventTokenIds: getRegionDefinition('greenwood').eventTokens
      .filter((token) => token.kind === 'combat')
      .map((token) => token.id),
  };
}

function roadTarget(roadId: MapRoadId): Extract<MapTravelTarget, { kind: 'road' }> {
  return {
    kind: 'road',
    tileKey: createMapTileKey(0, 0),
    roadId,
  };
}

function travelWithoutBoss(map: ReturnType<typeof initializeSoloMap>, target: MapTravelTarget) {
  return travelOnSoloMap(map, target, () => 0.99);
}

describe('soloMap', () => {
  it('initializes the start tile with Greenwood events and eight frontier roads', () => {
    const map = initializeSoloMap();
    const startTile = map.tiles['0,0'];

    expect(startTile).toMatchObject({
      key: '0,0',
      x: 0,
      y: 0,
      kind: 'start',
      events: {},
    });
    expect(map.playerPosition).toEqual({ tileKey: '0,0', locationId: 'start' });
    expect(getReachableMapTargets(map).map(createMapTravelTargetKey)).toEqual(
      MAP_ROAD_IDS.map((roadId) => `road:0,0:${roadId}`),
    );
  });

  it('creates standard tiles by consuming unique Greenwood event tokens', () => {
    const availableTokenIds = getRegionDefinition('greenwood').eventTokens.map((token) => token.id);
    const tile = createForestMapTile(2, -3, availableTokenIds, () => 0);

    expect(MAP_LOCATION_POINTS).toEqual({
      A: { x: 91, y: 73 },
      B: { x: 137, y: 100 },
      C: { x: 95, y: 160 },
      D: { x: 156, y: 190 },
    });
    expect(Object.keys(tile.events)).toEqual(MAP_ENCOUNTER_LOCATION_IDS);
    expect(Object.values(tile.events).map((event) => event?.tokenId)).toEqual(availableTokenIds.slice(0, 4));
    expect(Object.values(tile.events).every((event) => event?.cleared === false)).toBe(true);
  });

  it('uses empty, already-visited tokens after Greenwood has no event tokens left', () => {
    const tile = createForestMapTile(2, -3, [], () => 0);

    expect(Object.values(tile.events)).toEqual(expect.arrayContaining([
      expect.objectContaining({ tokenId: null, kind: 'empty', cleared: false }),
    ]));
  });

  it('removes frontier roads only after Greenwood is out of events and its boss is discovered', () => {
    const map = initializeSoloMap();
    map.availableEventTokenIds = [];
    map.tiles['boss-tile'] = {
      key: 'boss-tile',
      x: 20,
      y: 20,
      kind: 'forest',
      events: {
        B: {
          id: 'boss-tile:B',
          locationId: 'B',
          tokenId: null,
          kind: 'boss',
          monsterId: 'golem-lord',
          cleared: false,
        },
      },
    };
    const startTile = map.tiles['0,0'];

    expect(getFrontierRoadIds(map, startTile)).toEqual([]);
    expect(getReachableMapTargets(map)).toEqual([]);
    expect(travelOnSoloMap(map, roadTarget('right-75')).map).toBe(map);
  });

  it('reveals a frontier tile without moving the player or resolving its arrival event', () => {
    const map = initializeSoloMap();
    const discovery = discoverSoloMapRoad(map, roadTarget('right-75'), () => 0.99);

    expect(discovery).toMatchObject({
      arrivalTarget: { kind: 'location', tileKey: '1,0', locationId: 'A' },
      revealedTileKey: '1,0',
    });
    expect(discovery?.map.playerPosition).toEqual(map.playerPosition);
    expect(discovery?.map.activeEncounter).toBeNull();
    expect(discovery?.map.tiles['1,0'].events.A?.cleared).toBe(false);
    expect(discovery?.map.availableEventTokenIds).toHaveLength(map.availableEventTokenIds.length - 4);
  });

  it('places the first-tile boss at 5% and never on the blind arrival location', () => {
    const result = travelOnSoloMap(initializeSoloMap(), roadTarget('right-75'), () => 0);
    const tile = result.map.tiles['1,0'];
    const bossEvents = Object.values(tile.events).filter((event) => event?.kind === 'boss');

    expect(result.map.playerPosition.locationId).toBe('A');
    expect(tile.events.A?.kind).not.toBe('boss');
    expect(bossEvents).toEqual([
      expect.objectContaining({ kind: 'boss', monsterId: 'golem-lord', locationId: 'B' }),
    ]);

    const completedEntry = completeActiveMapEncounter(result.map);
    const nextTile = travelOnSoloMap(completedEntry, {
      kind: 'road',
      tileKey: '1,0',
      roadId: 'top-75',
    }, () => 0);
    const allBosses = Object.values(nextTile.map.tiles).flatMap((candidate) => (
      Object.values(candidate.events).filter((event) => event?.kind === 'boss')
    ));
    expect(allBosses).toHaveLength(1);
  });

  it('always places the boss on the current tile when no event tokens remain', () => {
    const first = travelOnSoloMap(
      { ...initializeSoloMap(), availableEventTokenIds: [] },
      roadTarget('right-75'),
      () => 0.99,
    );

    expect(Object.values(first.map.tiles['1,0'].events)).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'boss', monsterId: 'golem-lord' }),
    ]));
    expect(getFrontierRoadIds(first.map, first.map.tiles['1,0'])).toEqual([]);
  });

  it('randomly replaces a filled slot when the current tile consumes the final tokens', () => {
    const availableTokenIds = getRegionDefinition('greenwood').eventTokens.slice(0, 4).map((token) => token.id);
    const result = travelOnSoloMap(
      { ...initializeSoloMap(), availableEventTokenIds: availableTokenIds },
      roadTarget('right-75'),
      () => 0.99,
    );
    const events = Object.values(result.map.tiles['1,0'].events);

    expect(events).toHaveLength(4);
    expect(events.filter((event) => event?.kind === 'boss')).toHaveLength(1);
    expect(events.filter((event) => event?.kind === 'combat')).toHaveLength(3);
    expect(result.map.availableEventTokenIds).toEqual([]);
  });

  it('caps boss chance at 100%', () => {
    const map = { ...initializeSoloMap(), tiles: { ...initializeSoloMap().tiles } };
    for (let index = 0; index < 20; index += 1) {
      const tile = createForestMapTile(index + 10, 10, [], () => 0.99);
      map.tiles[tile.key] = tile;
    }
    map.availableEventTokenIds = [];

    const result = travelOnSoloMap(map, roadTarget('right-75'), () => 0.9999);
    expect(Object.values(result.map.tiles['1,0'].events).some((event) => event?.kind === 'boss')).toBe(true);
  });

  it.each<{
    roadId: MapRoadId;
    tileKey: string;
    locationId: MapLocationId;
  }>([
    { roadId: 'left-75', tileKey: '-1,0', locationId: 'B' },
    { roadId: 'left-155', tileKey: '-1,0', locationId: 'D' },
    { roadId: 'top-75', tileKey: '0,-1', locationId: 'C' },
    { roadId: 'top-195', tileKey: '0,-1', locationId: 'D' },
    { roadId: 'right-75', tileKey: '1,0', locationId: 'A' },
    { roadId: 'right-155', tileKey: '1,0', locationId: 'C' },
    { roadId: 'bottom-75', tileKey: '0,1', locationId: 'A' },
    { roadId: 'bottom-195', tileKey: '0,1', locationId: 'B' },
  ])('maps start road $roadId to $tileKey location $locationId', ({ roadId, tileKey, locationId }) => {
    const result = travelWithoutBoss(initializeCombatOnlyMap(), roadTarget(roadId));

    expect(result.enteredEncounter).toBe(true);
    expect(result.map.playerPosition).toEqual({ tileKey, locationId });
    expect(result.map.activeEncounter).toMatchObject({ tileKey, locationId, monsterId: 'goblin' });
  });

  it('allows only graph-adjacent internal movement and immediate encounter completion', () => {
    const arrivedAtA = travelWithoutBoss(initializeCombatOnlyMap(), roadTarget('right-75'));
    const mapAtA = completeActiveMapEncounter(arrivedAtA.map);

    expect(mapAtA.tiles['1,0'].events.A?.cleared).toBe(true);
    expect(getMapLocationMarkerKind(mapAtA, '1,0', 'A')).toBe('player');
    expect(getReachableMapTargets(mapAtA).map(createMapTravelTargetKey)).toEqual([
      'location:1,0:B',
      'location:0,0:start',
      'road:1,0:top-75',
    ]);

    const invalidMove = travelOnSoloMap(mapAtA, {
      kind: 'location',
      tileKey: '1,0',
      locationId: 'D',
    });
    expect(invalidMove.map).toBe(mapAtA);

    const arrivedAtB = travelOnSoloMap(mapAtA, {
      kind: 'location',
      tileKey: '1,0',
      locationId: 'B',
    });
    const mapAtB = completeActiveMapEncounter(arrivedAtB.map);

    expect(mapAtB.tiles['1,0'].events.B?.cleared).toBe(true);
    expect(getMapLocationMarkerKind(mapAtB, '1,0', 'A')).toBe('cleared');
    expect(getMapLocationMarkerKind(mapAtB, '1,0', 'B')).toBe('player');
    expect(getReachableMapTargets(mapAtB).map(createMapTravelTargetKey)).toEqual([
      'location:1,0:A',
      'location:1,0:C',
      'road:1,0:top-195',
      'road:1,0:right-75',
    ]);
  });

  it('follows the right-75 to A, A to B, and A top-75 to C regression path', () => {
    const arrivedAtA = travelWithoutBoss(initializeCombatOnlyMap(), roadTarget('right-75'));
    const mapAtA = completeActiveMapEncounter(arrivedAtA.map);
    const reachableFromA = getReachableMapTargets(mapAtA).map(createMapTravelTargetKey);

    expect(mapAtA.playerPosition).toEqual({ tileKey: '1,0', locationId: 'A' });
    expect(reachableFromA).toEqual([
      'location:1,0:B',
      'location:0,0:start',
      'road:1,0:top-75',
    ]);

    const arrivedAtC = travelWithoutBoss(mapAtA, {
      kind: 'road',
      tileKey: '1,0',
      roadId: 'top-75',
    });

    expect(arrivedAtC.map.playerPosition).toEqual({ tileKey: '1,-1', locationId: 'C' });
  });

  it('removes both frontier markers on a discovered edge and backtracks across it', () => {
    const arrivedAtA = travelWithoutBoss(initializeCombatOnlyMap(), roadTarget('right-75'));
    const mapAtA = completeActiveMapEncounter(arrivedAtA.map);
    const startTile = mapAtA.tiles['0,0'];
    const eastTile = mapAtA.tiles['1,0'];

    expect(Object.keys(mapAtA.tiles)).toEqual(['0,0', '1,0']);
    expect(getFrontierRoadIds(mapAtA, startTile)).not.toContain('right-75');
    expect(getFrontierRoadIds(mapAtA, startTile)).not.toContain('right-155');
    expect(getFrontierRoadIds(mapAtA, eastTile)).not.toContain('left-75');
    expect(getFrontierRoadIds(mapAtA, eastTile)).not.toContain('left-155');

    const returned = travelOnSoloMap(mapAtA, {
      kind: 'location',
      tileKey: '0,0',
      locationId: 'start',
    });

    expect(returned.enteredEncounter).toBe(false);
    expect(returned.map.playerPosition).toEqual({ tileKey: '0,0', locationId: 'start' });
    expect(Object.keys(returned.map.tiles)).toEqual(['0,0', '1,0']);
    expect(getReachableMapTargets(returned.map).map(createMapTravelTargetKey)).toContain(
      'location:1,0:A',
    );
    expect(getReachableMapTargets(returned.map).map(createMapTravelTargetKey)).toContain(
      'location:1,0:C',
    );
  });
});
