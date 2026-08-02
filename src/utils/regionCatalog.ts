/** The canonical catalogue for adventure regions and their finite location-event tokens. */
import goblinImageSrc from '../assets/enemies/goblin.png';
import healingShrineImageSrc from '../assets/enemies/healing_shrine.png';
import healingShrineVisitedImageSrc from '../assets/enemies/healing_shrine_visited.png';
import sacrificialAltarImageSrc from '../assets/enemies/sacrificial_altar.png';
import sacrificialAltarVisitedImageSrc from '../assets/enemies/sacrificial_altar_visited.png';
import witchImageSrc from '../assets/enemies/witch.png';
import shadeImageSrc from '../assets/enemies/shade.png';
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
  bossMonsterIds: readonly MonsterId[];
}

const goblinTokens = Array.from({ length: 6 }, (_, index) => ({
  id: `greenwood-goblin-${index + 1}`,
  name: 'Goblin',
  kind: 'combat' as const,
  monsterId: 'goblin' as const,
  unvisitedImageSrc: goblinImageSrc,
  visitedImageSrc: tokenVisitedImageSrc,
}));

const witchTokens = Array.from({ length: 6 }, (_, index) => ({
  id: `greenwood-witch-${index + 1}`,
  name: 'Witch',
  kind: 'combat' as const,
  monsterId: 'witch' as const,
  unvisitedImageSrc: witchImageSrc,
  visitedImageSrc: tokenVisitedImageSrc,
}));

const shadeTokens = Array.from({ length: 6 }, (_, index) => ({
  id: `greenwood-shade-${index + 1}`,
  name: 'Shade',
  kind: 'combat' as const,
  monsterId: 'shade' as const,
  unvisitedImageSrc: shadeImageSrc,
  visitedImageSrc: tokenVisitedImageSrc,
}));

const healingShrineTokens = Array.from({ length: 3 }, (_, index) => ({
  id: `greenwood-healing-shrine-${index + 1}`,
  name: 'Healing Shrine',
  kind: 'healing' as const,
  healingPercent: 25,
  unvisitedImageSrc: healingShrineImageSrc,
  visitedImageSrc: healingShrineVisitedImageSrc,
}));

const sacrificialAltarTokens = Array.from({ length: 3 }, (_, index) => ({
  id: `greenwood-sacrificial-altar-${index + 1}`,
  name: 'Sacrificial Altar',
  kind: 'sacrificial-altar' as const,
  unvisitedImageSrc: sacrificialAltarImageSrc,
  visitedImageSrc: sacrificialAltarVisitedImageSrc,
}));

export const REGION_CATALOG = {
  greenwood: {
    id: 'greenwood',
    name: 'Greenwood',
    eventTokens: [
      ...goblinTokens,
      ...witchTokens,
      ...shadeTokens,
      ...healingShrineTokens,
      ...sacrificialAltarTokens,
    ],
    bossMonsterIds: ['golem-lord'],
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
