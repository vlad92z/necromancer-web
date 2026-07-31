import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import { useGameplayActions, useUIActions } from '../../../../hooks/useGameActions';
import { useArcaneDust, useSoloMapState } from '../../../../hooks/useGameState';
import { useClickSound } from '../../../../hooks/useClickSound';
import type { MapTravelTarget } from '../../../../types/game';
import { RuneZoneButton } from '../../../../components/DeckButton';
import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import {
  createMapTravelTargetKey,
  getMapLocationPoint,
  getReachableMapTargets,
  MAP_TILE_SIZE,
} from '../../../../utils/soloMap';
import { MapTile } from './MapTile';

const MAP_SCALE = 1.5;

export function SoloMapView(): ReactElement {
  const map = useSoloMapState();
  const arcaneDust = useArcaneDust();
  const { travelToMapTarget } = useGameplayActions();
  const { openSettingsOverlay } = useUIActions();
  const playClickSound = useClickSound();
  const currentMarkerRef = useRef<HTMLDivElement | null>(null);
  const restoreKeyboardFocusRef = useRef(false);
  const [announcement, setAnnouncement] = useState('Player at the starting camp');

  const tiles = useMemo(
    () => Object.values(map.tiles).sort((left, right) => left.y - right.y || left.x - right.x),
    [map.tiles],
  );
  const reachableTargetKeys = useMemo(
    () => new Set(getReachableMapTargets(map).map(createMapTravelTargetKey)),
    [map],
  );
  const playerTile = map.tiles[map.playerPosition.tileKey];
  const playerPoint = getMapLocationPoint(map.playerPosition.locationId);
  const playerWorldX = (playerTile?.x ?? 0) * MAP_TILE_SIZE + playerPoint.x;
  const playerWorldY = (playerTile?.y ?? 0) * MAP_TILE_SIZE + playerPoint.y;

  const handleCurrentMarker = useCallback((element: HTMLDivElement | null) => {
    currentMarkerRef.current = element;
  }, []);

  const handleTravel = useCallback((
    target: MapTravelTarget,
    fromKeyboard: boolean,
  ) => {
    restoreKeyboardFocusRef.current = fromKeyboard;
    playClickSound();
    travelToMapTarget(target);
  }, [playClickSound, travelToMapTarget]);

  useEffect(() => {
    const locationLabel = map.playerPosition.locationId === 'start'
      ? 'the starting camp'
      : `location ${map.playerPosition.locationId}`;
    setAnnouncement(
      `Player moved to ${locationLabel} on tile ${playerTile?.x ?? 0}, ${playerTile?.y ?? 0}`,
    );

    if (!restoreKeyboardFocusRef.current) {
      return;
    }

    restoreKeyboardFocusRef.current = false;
    const focusFrame = window.requestAnimationFrame(() => {
      currentMarkerRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(focusFrame);
  }, [
    map.playerPosition.locationId,
    map.playerPosition.tileKey,
    playerTile?.x,
    playerTile?.y,
  ]);

  return (
    <div className="relative flex h-full min-h-0 flex-col font-pixel">
      <header className="pixel-game-header z-30 flex min-h-22 items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <h1 className="pixel-section-title text-2xl">Greenwood</h1>
          <div className="flex items-center gap-2 text-[#f2c14e]" aria-label={`Arcane Dust: ${arcaneDust.toLocaleString()}`}>
              <img
                src={arcaneDustIcon}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
              />
              <span className="text-lg">{arcaneDust.toLocaleString()}</span>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <RuneZoneButton zone="deck" />
          <ClickSoundButton
            title="⚙"
            action={openSettingsOverlay}
            className="pixel-game-button flex h-15 w-15 items-center justify-center px-0 pb-2 text-4xl"
          />
        </div>
      </header>

      <section
        aria-label="Traversable adventure map"
        className="relative min-h-0 flex-1 overflow-hidden bg-[#101816]"
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformOrigin: 'top left',
            transform: `translate(${-playerWorldX * MAP_SCALE}px, ${-playerWorldY * MAP_SCALE}px) scale(${MAP_SCALE})`,
          }}
        >
          {tiles.map((tile) => (
            <MapTile
              key={tile.key}
              map={map}
              tile={tile}
              reachableTargetKeys={reachableTargetKeys}
              onTravel={handleTravel}
              onCurrentMarker={handleCurrentMarker}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{announcement}</p>
      </section>
    </div>
  );
}
