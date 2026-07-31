/** The canonical catalogue for adventure regions and their finite location-event tokens. */
import goblinImageSrc from '../assets/enemies/goblin.png';
import healingShrineImageSrc from '../assets/enemies/healing_shrine.png';
import tokenVisitedImageSrc from '../assets/map/token_visited.png';
import type { MapEventKind, MonsterId, RegionId } from '../types/game';

export interface RegionEventTokenDefinition {
  id: string;
  name: string;
  kind: MapEventKind;
  unvisitedImageSrc: string;
  visitedImageSrc: string;
  monsterId?: MonsterId;
  healingPercent?: number;
}

export interface RegionDefinition {
  id: RegionId;
  name: string;
  eventTokens: readonly RegionEventTokenDefinition[];
}

const goblinTokens = Array.from({ length: 12 }, (_, index) => ({
  id: `greenwood-goblin-${index + 1}`,
  name: 'Goblin',
  kind: 'combat' as const,
  monsterId: 'goblin' as const,
  unvisitedImageSrc: goblinImageSrc,
  visitedImageSrc: tokenVisitedImageSrc,
}));

const healingShrineTokens = Array.from({ length: 2 }, (_, index) => ({
  id: `greenwood-healing-shrine-${index + 1}`,
  name: 'Healing Shrine',
  kind: 'healing' as const,
  healingPercent: 25,
  unvisitedImageSrc: healingShrineImageSrc,
  visitedImageSrc: tokenVisitedImageSrc,
}));

export const REGION_CATALOG = {
  greenwood: {
    id: 'greenwood',
    name: 'Greenwood',
    eventTokens: [...goblinTokens, ...healingShrineTokens],
  },
} satisfies Record<RegionId, RegionDefinition>;

export function getRegionDefinition(regionId: RegionId): RegionDefinition {
  return REGION_CATALOG[regionId];
}

export function getRegionEventToken(tokenId: string | null): RegionEventTokenDefinition | null {
  if (!tokenId) return null;
  return Object.values(REGION_CATALOG)
    .flatMap((region) => region.eventTokens)
    .find((token) => token.id === tokenId) ?? null;
}
