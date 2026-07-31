/**
 * Pure topology and navigation helpers for the solo adventure map.
 */

import type {
  MapEncounterLocationId,
  MapLocationEvent,
  MapLocationId,
  MapPoint,
  MapRoadId,
  MapTileState,
  MapTravelTarget,
  SoloMapState,
  MonsterId,
} from '../types/game';
import { getRegionDefinition, getRegionEventToken } from './regionCatalog';

export const MAP_TILE_SIZE = 256;
export const START_MAP_LOCATION: MapPoint = { x: 128, y: 128 };

export const MAP_LOCATION_POINTS: Record<MapEncounterLocationId, MapPoint> = {
  A: { x: 91, y: 73 },
  B: { x: 137, y: 100 },
  C: { x: 95, y: 160 },
  D: { x: 156, y: 190 },
};

export const MAP_ROAD_POINTS: Record<MapRoadId, MapPoint> = {
  'left-75': { x: 0, y: 75 },
  'left-155': { x: 0, y: 155 },
  'top-75': { x: 75, y: 0 },
  'top-195': { x: 195, y: 0 },
  'right-75': { x: 256, y: 75 },
  'right-155': { x: 256, y: 155 },
  'bottom-75': { x: 75, y: 256 },
  'bottom-195': { x: 195, y: 256 },
};

export const MAP_ROAD_IDS = Object.keys(MAP_ROAD_POINTS) as MapRoadId[];
export const MAP_ENCOUNTER_LOCATION_IDS: MapEncounterLocationId[] = ['A', 'B', 'C', 'D'];

const INTERNAL_CONNECTIONS: Record<MapEncounterLocationId, MapEncounterLocationId[]> = {
  A: ['B'],
  B: ['A', 'C'],
  C: ['B', 'D'],
  D: ['C'],
};

const LOCATION_ROADS: Record<MapEncounterLocationId, MapRoadId[]> = {
  A: ['left-75', 'top-75'],
  B: ['top-195', 'right-75'],
  C: ['left-155', 'bottom-75'],
  D: ['right-155', 'bottom-195'],
};

const ROAD_LOCATIONS: Record<MapRoadId, MapEncounterLocationId> = {
  'left-75': 'A',
  'top-75': 'A',
  'top-195': 'B',
  'right-75': 'B',
  'left-155': 'C',
  'bottom-75': 'C',
  'right-155': 'D',
  'bottom-195': 'D',
};

const OPPOSITE_ROADS: Record<MapRoadId, MapRoadId> = {
  'left-75': 'right-75',
  'left-155': 'right-155',
  'top-75': 'bottom-75',
  'top-195': 'bottom-195',
  'right-75': 'left-75',
  'right-155': 'left-155',
  'bottom-75': 'top-75',
  'bottom-195': 'top-195',
};

interface MapTileCoordinate {
  x: number;
  y: number;
}

interface ForestTileBossRoll {
  bossMonsterIds: readonly MonsterId[];
  chance: number;
  excludedLocationId: MapEncounterLocationId;
}

export interface MapTravelResult {
  map: SoloMapState;
  enteredEncounter: boolean;
  triggeredEvent: MapLocationEvent | null;
}

export type MapLocationMarkerKind = 'player' | 'encounter' | 'cleared';

export function createMapTileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function createStartMapTile(): MapTileState {
  return {
    key: createMapTileKey(0, 0),
    x: 0,
    y: 0,
    kind: 'start',
    events: {},
  };
}

export function createForestMapTile(
  x: number,
  y: number,
  availableEventTokenIds = getRegionDefinition('greenwood').eventTokens.map((token) => token.id),
  random = Math.random,
  bossRoll?: ForestTileBossRoll,
): MapTileState {
  const key = createMapTileKey(x, y);
  const selectedTokenIds = [...availableEventTokenIds];
  const shouldPlaceBoss = Boolean(
    bossRoll
    && bossRoll.bossMonsterIds.length > 0
    && random() < bossRoll.chance
  );
  const bossMonsterId = shouldPlaceBoss && bossRoll
    ? bossRoll.bossMonsterIds[Math.floor(random() * bossRoll.bossMonsterIds.length)] ?? null
    : null;
  const bossLocations = bossRoll
    ? MAP_ENCOUNTER_LOCATION_IDS.filter((locationId) => locationId !== bossRoll.excludedLocationId)
    : [];
  const bossLocationId = bossMonsterId
    ? bossLocations[Math.floor(random() * bossLocations.length)] ?? null
    : null;
  const events = MAP_ENCOUNTER_LOCATION_IDS.reduce<MapTileState['events']>((result, locationId) => {
    if (locationId === bossLocationId && bossMonsterId) {
      result[locationId] = {
        id: `${key}:${locationId}`,
        locationId,
        tokenId: null,
        kind: 'boss',
        monsterId: bossMonsterId,
        cleared: false,
      };
      return result;
    }

    const selectedIndex = selectedTokenIds.length === 0 ? -1 : Math.floor(random() * selectedTokenIds.length);
    const tokenId = selectedIndex === -1 ? null : selectedTokenIds.splice(selectedIndex, 1)[0] ?? null;
    const token = getRegionEventToken(tokenId);
    result[locationId] = {
      id: `${key}:${locationId}`,
      locationId,
      tokenId,
      kind: token?.kind ?? 'empty',
      ...(token?.monsterId ? { monsterId: token.monsterId } : {}),
      cleared: false,
    };
    return result;
  }, {});

  return {
    key,
    x,
    y,
    kind: 'forest',
    events,
  };
}

export function hasDiscoveredBoss(map: SoloMapState): boolean {
  return Object.values(map.tiles).some((tile) => (
    Object.values(tile.events).some((event) => event?.kind === 'boss')
  ));
}

function canDiscoverNewTile(map: SoloMapState): boolean {
  return map.availableEventTokenIds.length > 0 || !hasDiscoveredBoss(map);
}

export function initializeSoloMap(): SoloMapState {
  const startTile = createStartMapTile();
  return {
    regionId: 'greenwood',
    availableEventTokenIds: getRegionDefinition('greenwood').eventTokens.map((token) => token.id),
    tiles: {
      [startTile.key]: startTile,
    },
    playerPosition: {
      tileKey: startTile.key,
      locationId: 'start',
    },
    activeEncounter: null,
  };
}

export function getMapLocationPoint(locationId: MapLocationId): MapPoint {
  return locationId === 'start' ? START_MAP_LOCATION : MAP_LOCATION_POINTS[locationId];
}

export function getMapLocationMarkerKind(
  map: SoloMapState,
  tileKey: string,
  locationId: MapLocationId,
): MapLocationMarkerKind {
  if (
    map.playerPosition.tileKey === tileKey
    && map.playerPosition.locationId === locationId
  ) {
    return 'player';
  }

  if (locationId === 'start') {
    return 'cleared';
  }

  return map.tiles[tileKey]?.events[locationId]?.cleared
    ? 'cleared'
    : 'encounter';
}

export function getNeighborCoordinate(tile: MapTileState, roadId: MapRoadId): MapTileCoordinate {
  if (roadId.startsWith('left-')) {
    return { x: tile.x - 1, y: tile.y };
  }
  if (roadId.startsWith('right-')) {
    return { x: tile.x + 1, y: tile.y };
  }
  if (roadId.startsWith('top-')) {
    return { x: tile.x, y: tile.y - 1 };
  }
  return { x: tile.x, y: tile.y + 1 };
}

export function getOppositeRoad(roadId: MapRoadId): MapRoadId {
  return OPPOSITE_ROADS[roadId];
}

export function getLocationForRoad(roadId: MapRoadId): MapEncounterLocationId {
  return ROAD_LOCATIONS[roadId];
}

function createRoadTarget(tileKey: string, roadId: MapRoadId): MapTravelTarget {
  return { kind: 'road', tileKey, roadId };
}

function createLocationTarget(tileKey: string, locationId: MapLocationId): MapTravelTarget {
  return { kind: 'location', tileKey, locationId };
}

function getTargetAcrossRoad(
  map: SoloMapState,
  tile: MapTileState,
  roadId: MapRoadId,
): MapTravelTarget {
  const neighborCoordinate = getNeighborCoordinate(tile, roadId);
  const neighborKey = createMapTileKey(neighborCoordinate.x, neighborCoordinate.y);
  const neighbor = map.tiles[neighborKey];

  if (!neighbor) {
    return createRoadTarget(tile.key, roadId);
  }

  const locationId = neighbor.kind === 'start'
    ? 'start'
    : getLocationForRoad(getOppositeRoad(roadId));
  return createLocationTarget(neighbor.key, locationId);
}

export function getReachableMapTargets(map: SoloMapState): MapTravelTarget[] {
  const currentTile = map.tiles[map.playerPosition.tileKey];
  if (!currentTile) {
    return [];
  }

  if (currentTile.kind === 'start') {
    return MAP_ROAD_IDS
      .map((roadId) => getTargetAcrossRoad(map, currentTile, roadId))
      .filter((target) => target.kind === 'location' || canDiscoverNewTile(map));
  }

  const locationId = map.playerPosition.locationId;
  if (locationId === 'start') {
    return [];
  }

  const targets = [
    ...INTERNAL_CONNECTIONS[locationId].map((connectedLocationId) => (
      createLocationTarget(currentTile.key, connectedLocationId)
    )),
    ...LOCATION_ROADS[locationId].map((roadId) => getTargetAcrossRoad(map, currentTile, roadId)),
  ];
  return targets.filter((target) => target.kind === 'location' || canDiscoverNewTile(map));
}

export function createMapTravelTargetKey(target: MapTravelTarget): string {
  return target.kind === 'road'
    ? `road:${target.tileKey}:${target.roadId}`
    : `location:${target.tileKey}:${target.locationId}`;
}

export function getFrontierRoadIds(map: SoloMapState, tile: MapTileState): MapRoadId[] {
  if (!canDiscoverNewTile(map)) {
    return [];
  }

  return MAP_ROAD_IDS.filter((roadId) => {
    const neighborCoordinate = getNeighborCoordinate(tile, roadId);
    return !map.tiles[createMapTileKey(neighborCoordinate.x, neighborCoordinate.y)];
  });
}

function arriveAtLocation(
  map: SoloMapState,
  tileKey: string,
  locationId: MapLocationId,
): MapTravelResult {
  const tile = map.tiles[tileKey];
  if (!tile) {
    return { map, enteredEncounter: false, triggeredEvent: null };
  }

  if (locationId === 'start' || tile.kind === 'start') {
    return {
      map: {
        ...map,
        playerPosition: { tileKey, locationId: 'start' },
        activeEncounter: null,
      },
      enteredEncounter: false,
      triggeredEvent: null,
    };
  }

  const event = tile.events[locationId];
  if (!event) {
    return { map, enteredEncounter: false, triggeredEvent: null };
  }

  const isCombatEvent = event.kind === 'combat' || event.kind === 'boss';
  const shouldClearImmediately = !isCombatEvent && !event.cleared;
  const nextEvent = shouldClearImmediately ? { ...event, cleared: true } : event;

  return {
    map: {
      ...map,
      tiles: shouldClearImmediately
        ? {
          ...map.tiles,
          [tile.key]: { ...tile, events: { ...tile.events, [locationId]: nextEvent } },
        }
        : map.tiles,
      playerPosition: { tileKey, locationId },
      activeEncounter: !isCombatEvent || event.cleared || !event.monsterId
        ? null
        : {
          id: event.id,
          tileKey,
          locationId,
          monsterId: event.monsterId,
        },
    },
    enteredEncounter: isCombatEvent && !event.cleared,
    triggeredEvent: shouldClearImmediately ? event : null,
  };
}

export function completeActiveMapEncounter(map: SoloMapState): SoloMapState {
  const activeEncounter = map.activeEncounter;
  if (!activeEncounter) {
    return map;
  }

  const tile = map.tiles[activeEncounter.tileKey];
  const event = tile?.events[activeEncounter.locationId];
  if (!tile || !event) {
    return { ...map, activeEncounter: null };
  }

  return {
    ...map,
    tiles: {
      ...map.tiles,
      [tile.key]: {
        ...tile,
        events: {
          ...tile.events,
          [event.locationId]: {
            ...event,
            cleared: true,
          },
        },
      },
    },
    activeEncounter: null,
  };
}

export function travelOnSoloMap(
  map: SoloMapState,
  target: MapTravelTarget,
  random = Math.random,
): MapTravelResult {
  const reachableTarget = getReachableMapTargets(map).find((candidate) => (
    createMapTravelTargetKey(candidate) === createMapTravelTargetKey(target)
  ));
  if (!reachableTarget) {
    return { map, enteredEncounter: false, triggeredEvent: null };
  }

  if (reachableTarget.kind === 'location') {
    return arriveAtLocation(map, reachableTarget.tileKey, reachableTarget.locationId);
  }

  const sourceTile = map.tiles[reachableTarget.tileKey];
  if (!sourceTile) {
    return { map, enteredEncounter: false, triggeredEvent: null };
  }

  const neighborCoordinate = getNeighborCoordinate(sourceTile, reachableTarget.roadId);
  const neighborKey = createMapTileKey(neighborCoordinate.x, neighborCoordinate.y);
  const destinationLocation = getLocationForRoad(getOppositeRoad(reachableTarget.roadId));
  const discoveredForestTileCount = Object.values(map.tiles).filter((tile) => tile.kind === 'forest').length;
  const region = getRegionDefinition(map.regionId);
  const neighbor = map.tiles[neighborKey] ?? createForestMapTile(
    neighborCoordinate.x,
    neighborCoordinate.y,
    map.availableEventTokenIds,
    random,
    hasDiscoveredBoss(map)
      ? undefined
      : {
        bossMonsterIds: region.bossMonsterIds,
        chance: Math.min(1, (discoveredForestTileCount + 1) * 0.05),
        excludedLocationId: destinationLocation,
      },
  );
  const mapWithNeighbor = map.tiles[neighborKey]
    ? map
    : {
      ...map,
      availableEventTokenIds: map.availableEventTokenIds.filter((tokenId) => !Object.values(neighbor.events).some(
        (event) => event?.tokenId === tokenId,
      )),
      tiles: {
        ...map.tiles,
        [neighbor.key]: neighbor,
      },
    };
  return arriveAtLocation(mapWithNeighbor, neighbor.key, destinationLocation);
}
