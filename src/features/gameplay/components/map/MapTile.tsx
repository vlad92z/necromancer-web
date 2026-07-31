import type { KeyboardEvent, MouseEvent, ReactElement } from 'react';
import type {
  MapLocationId,
  MapPoint,
  MapTileState,
  MapTravelTarget,
  SoloMapState,
} from '../../../../types/game';
import {
  createMapTravelTargetKey,
  getFrontierRoadIds,
  getMapLocationMarkerKind,
  MAP_ENCOUNTER_LOCATION_IDS,
  MAP_LOCATION_POINTS,
  MAP_ROAD_POINTS,
  MAP_TILE_SIZE,
  START_MAP_LOCATION,
  type MapLocationMarkerKind,
} from '../../../../utils/soloMap';
import forestTileImage from '../../../../assets/map/tile_1.png';
import tokenVisited from '../../../../assets/map/token_visited.png';
import playerToken from '../../../../assets/enemies/wizard.png';
import tokenPath from '../../../../assets/map/token_path.png';
import { getRegionEventToken } from '../../../../utils/regionCatalog';

interface MapTileProps {
  map: SoloMapState;
  tile: MapTileState;
  reachableTargetKeys: Set<string>;
  onTravel: (target: MapTravelTarget, fromKeyboard: boolean) => void;
  onCurrentMarker: (element: HTMLDivElement | null) => void;
}

interface MapMarkerProps {
  point: MapPoint;
  imageSrc: string;
  label: string;
  target?: MapTravelTarget;
  reachable: boolean;
  current: boolean;
  markerKind: MapLocationMarkerKind | 'frontier';
  onTravel: MapTileProps['onTravel'];
  onCurrentMarker: MapTileProps['onCurrentMarker'];
}

const markerPositionClassName = 'absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center';
const markerImageClassName = 'h-8 w-8 object-contain [image-rendering:pixelated] drop-shadow-[2px_2px_0_#141313]';

function MapMarker({
  point,
  imageSrc,
  label,
  target,
  reachable,
  current,
  markerKind,
  onTravel,
  onCurrentMarker,
}: MapMarkerProps): ReactElement {
  const style = { left: `${point.x}px`, top: `${point.y}px` };

  if (current) {
    return (
      <div
        ref={onCurrentMarker}
        tabIndex={-1}
        aria-current="location"
        aria-label={label}
        data-map-current="true"
        data-map-marker={markerKind}
        className={`${markerPositionClassName} focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#fff8d8]`}
        style={style}
      >
        <img src={imageSrc} alt="" aria-hidden="true" className={markerImageClassName} />
      </div>
    );
  }

  if (reachable && target) {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onTravel(target, event.detail === 0);
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      onTravel(target, true);
    };

    return (
      <button
        type="button"
        aria-label={label}
        data-map-marker={markerKind}
        className={`${markerPositionClassName} hover:bg-[#fff8d8]/20 focus-visible:bg-[#fff8d8]/20 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#fff8d8]`}
        style={style}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <img src={imageSrc} alt="" aria-hidden="true" className={markerImageClassName} />
      </button>
    );
  }

  return (
    <div
      aria-hidden="true"
      data-map-marker={markerKind}
      className={`${markerPositionClassName} pointer-events-none`}
      style={style}
    >
      <img src={imageSrc} alt="" className={markerImageClassName} />
    </div>
  );
}

function getLocationLabel(
  tile: MapTileState,
  locationId: MapLocationId,
  markerKind: MapLocationMarkerKind,
): string {
  if (locationId === 'start') {
    return markerKind === 'player'
      ? 'Player at the starting camp'
      : 'Travel to the starting camp';
  }

  if (markerKind === 'player') {
    return `Player at location ${locationId} on tile ${tile.x}, ${tile.y}`;
  }
  if (markerKind === 'cleared') {
    return `Travel to cleared location ${locationId} on tile ${tile.x}, ${tile.y}`;
  }
  return `Travel to unvisited location ${locationId} on tile ${tile.x}, ${tile.y}`;
}

export function MapTile({
  map,
  tile,
  reachableTargetKeys,
  onTravel,
  onCurrentMarker,
}: MapTileProps): ReactElement {
  const renderLocationMarker = (locationId: MapLocationId, point: MapPoint) => {
    const markerKind = getMapLocationMarkerKind(map, tile.key, locationId);
    const target: MapTravelTarget = { kind: 'location', tileKey: tile.key, locationId };
    const reachable = reachableTargetKeys.has(createMapTravelTargetKey(target));
    const current = markerKind === 'player';
    const event = locationId === 'start' ? null : tile.events[locationId];
    const eventToken = getRegionEventToken(event?.tokenId ?? null);
    const imageSrc = current
      ? playerToken
      : markerKind === 'cleared'
        ? eventToken?.visitedImageSrc ?? tokenVisited
        : eventToken?.unvisitedImageSrc ?? tokenVisited;

    return (
      <MapMarker
        key={locationId}
        point={point}
        imageSrc={imageSrc}
        label={getLocationLabel(tile, locationId, markerKind)}
        target={target}
        reachable={reachable}
        current={current}
        markerKind={markerKind}
        onTravel={onTravel}
        onCurrentMarker={onCurrentMarker}
      />
    );
  };

  return (
    <div
      className="absolute overflow-visible"
      data-map-tile={tile.key}
      style={{
        left: `${tile.x * MAP_TILE_SIZE}px`,
        top: `${tile.y * MAP_TILE_SIZE}px`,
        width: `${MAP_TILE_SIZE}px`,
        height: `${MAP_TILE_SIZE}px`,
      }}
    >
      <img
        src={forestTileImage}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none [image-rendering:pixelated]"
      />

      {tile.kind === 'start'
        ? renderLocationMarker('start', START_MAP_LOCATION)
        : MAP_ENCOUNTER_LOCATION_IDS.map((locationId) => (
          renderLocationMarker(locationId, MAP_LOCATION_POINTS[locationId])
        ))}

      {getFrontierRoadIds(map, tile).map((roadId) => {
        const target: MapTravelTarget = { kind: 'road', tileKey: tile.key, roadId };
        return (
          <MapMarker
            key={roadId}
            point={MAP_ROAD_POINTS[roadId]}
            imageSrc={tokenPath}
            label={`Explore ${roadId.replace('-', ' ')} road from tile ${tile.x}, ${tile.y}`}
            target={target}
            reachable={reachableTargetKeys.has(createMapTravelTargetKey(target))}
            current={false}
            markerKind="frontier"
            onTravel={onTravel}
            onCurrentMarker={onCurrentMarker}
          />
        );
      })}
    </div>
  );
}
