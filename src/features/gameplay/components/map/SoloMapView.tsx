import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion } from 'framer-motion';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import { useGameplayActions, useUIActions } from '../../../../hooks/useGameActions';
import { useArcaneDust, useGameplayHealthState, useSoloMapState } from '../../../../hooks/useGameState';
import { useClickSound } from '../../../../hooks/useClickSound';
import type { MapTravelTarget } from '../../../../types/game';
import { RuneZoneButton } from '../../../../components/DeckButton';
import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import wizardWalk1 from '../../../../assets/map/characters/wizard_walk_1.png';
import wizardWalk2 from '../../../../assets/map/characters/wizard_walk_2.png';
import wizardWalk3 from '../../../../assets/map/characters/wizard_walk_3.png';
import wizardWalk4 from '../../../../assets/map/characters/wizard_walk_4.png';
import wizardWalk5 from '../../../../assets/map/characters/wizard_walk_5.png';
import wizardWalk6 from '../../../../assets/map/characters/wizard_walk_6.png';
import {
  createMapTravelTargetKey,
  getMapLocationPoint,
  getReachableMapTargets,
  MAP_TILE_SIZE,
} from '../../../../utils/soloMap';
import { getRegionDefinition } from '../../../../utils/regionCatalog';
import { ANIMATION } from '../../../../styles/tokens';
import { MapTile } from './MapTile';
import { SacrificialAltarModal } from './SacrificialAltarModal';
import { ArtefactEventModal } from './ArtefactEventModal';

const MAP_SCALE = 1.5;
const WIZARD_WALK_FRAMES = [
  wizardWalk1,
  wizardWalk2,
  wizardWalk3,
  wizardWalk4,
  wizardWalk5,
  wizardWalk6,
] as const;

type MapLocationTravelTarget = Extract<MapTravelTarget, { kind: 'location' }>;
interface MapWorldPoint {
  x: number;
  y: number;
}

interface PendingMapTravel {
  arrivalTarget: MapLocationTravelTarget;
  origin: MapWorldPoint;
  revealedTileKey: string | null;
  requiresEventResolve: boolean;
  stage: 'tile-reveal' | 'walking' | 'event-resolve';
}

function getMapTargetWorldPoint(
  tile: { x: number; y: number } | undefined,
  locationId: MapLocationTravelTarget['locationId'],
): MapWorldPoint | null {
  if (!tile) {
    return null;
  }

  const point = getMapLocationPoint(locationId);
  return {
    x: tile.x * MAP_TILE_SIZE + point.x,
    y: tile.y * MAP_TILE_SIZE + point.y,
  };
}

function getWizardTravelDurationMs(origin: MapWorldPoint, destination: MapWorldPoint): number {
  const distance = Math.hypot(destination.x - origin.x, destination.y - origin.y);
  return (distance / ANIMATION.MAP_WIZARD_TRAVEL_SPEED_PX_PER_SECOND) * 1000;
}

export function SoloMapView(): ReactElement {
  const map = useSoloMapState();
  const arcaneDust = useArcaneDust();
  const { health, maxHealth } = useGameplayHealthState();
  const { revealMapRoadTarget, travelToMapTarget } = useGameplayActions();
  const { openSettingsOverlay } = useUIActions();
  const playClickSound = useClickSound();
  const currentMarkerRef = useRef<HTMLDivElement | null>(null);
  const restoreKeyboardFocusRef = useRef(false);
  const [announcement, setAnnouncement] = useState('Player at the starting camp');
  const [pendingTravel, setPendingTravel] = useState<PendingMapTravel | null>(null);
  const [wizardFrameIndex, setWizardFrameIndex] = useState(0);
  const [wizardFacing, setWizardFacing] = useState<'left' | 'right'>('right');

  const tiles = useMemo(
    () => Object.values(map.tiles).sort((left, right) => left.y - right.y || left.x - right.x),
    [map.tiles],
  );
  const reachableTargetKeys = useMemo(
    () => new Set(getReachableMapTargets(map).map(createMapTravelTargetKey)),
    [map],
  );
  const playerTile = map.tiles[map.playerPosition.tileKey];
  const regionName = getRegionDefinition(map.regionId).name;
  const playerPoint = getMapLocationPoint(map.playerPosition.locationId);
  const playerWorldX = (playerTile?.x ?? 0) * MAP_TILE_SIZE + playerPoint.x;
  const playerWorldY = (playerTile?.y ?? 0) * MAP_TILE_SIZE + playerPoint.y;
  const playerWorldPoint = useMemo(() => ({ x: playerWorldX, y: playerWorldY }), [playerWorldX, playerWorldY]);
  const pendingDestination = pendingTravel
    ? getMapTargetWorldPoint(map.tiles[pendingTravel.arrivalTarget.tileKey], pendingTravel.arrivalTarget.locationId)
    : null;
  const pendingDestinationX = pendingDestination?.x;
  const wizardTravelDurationMs = pendingTravel && pendingDestination
    ? getWizardTravelDurationMs(pendingTravel.origin, pendingDestination)
    : 0;
  const wizardWorldPoint = pendingTravel && pendingTravel.stage !== 'tile-reveal' && pendingDestination
    ? pendingDestination
    : pendingTravel?.origin ?? playerWorldPoint;
  const cameraWorldPoint = pendingTravel && pendingTravel.stage !== 'tile-reveal' && pendingDestination
    ? pendingDestination
    : pendingTravel?.origin ?? playerWorldPoint;
  const healthPercent = maxHealth > 0
    ? Math.round(Math.max(0, Math.min(1, health / maxHealth)) * 100)
    : 0;

  const handleCurrentMarker = useCallback((element: HTMLDivElement | null) => {
    currentMarkerRef.current = element;
  }, []);

  const handleTravel = useCallback((
    target: MapTravelTarget,
    fromKeyboard: boolean,
  ) => {
    if (pendingTravel) {
      return;
    }

    restoreKeyboardFocusRef.current = fromKeyboard;
    playClickSound();

    if (target.kind === 'road') {
      const arrivalTarget = revealMapRoadTarget(target);
      if (!arrivalTarget) {
        return;
      }

      setPendingTravel({
        arrivalTarget,
        origin: playerWorldPoint,
        revealedTileKey: arrivalTarget.tileKey,
        requiresEventResolve: true,
        stage: 'tile-reveal',
      });
      return;
    }

    const event = target.locationId === 'start'
      ? null
      : map.tiles[target.tileKey]?.events[target.locationId];
    setPendingTravel({
      arrivalTarget: target,
      origin: playerWorldPoint,
      revealedTileKey: null,
      requiresEventResolve: Boolean(event && !event.cleared),
      stage: 'walking',
    });
  }, [map.tiles, pendingTravel, playClickSound, playerWorldPoint, revealMapRoadTarget]);

  useEffect(() => {
    if (!pendingTravel) {
      return;
    }

    const delay = pendingTravel.stage === 'tile-reveal'
      ? ANIMATION.MAP_TILE_REVEAL_DURATION_MS
      : pendingTravel.stage === 'walking'
        ? wizardTravelDurationMs
        : ANIMATION.MAP_EVENT_RESOLVE_DELAY_MS;
    const timer = window.setTimeout(() => {
      if (pendingTravel.stage === 'tile-reveal') {
        setPendingTravel({ ...pendingTravel, stage: 'walking' });
        return;
      }

      if (pendingTravel.stage === 'walking' && pendingTravel.requiresEventResolve) {
        setPendingTravel({ ...pendingTravel, stage: 'event-resolve' });
        return;
      }

      travelToMapTarget(pendingTravel.arrivalTarget);
      setPendingTravel(null);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [pendingTravel, travelToMapTarget, wizardTravelDurationMs]);

  useEffect(() => {
    if (pendingTravel?.stage !== 'walking') {
      setWizardFrameIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setWizardFrameIndex((currentFrame) => (currentFrame + 1) % WIZARD_WALK_FRAMES.length);
    }, ANIMATION.MAP_WIZARD_FRAME_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [pendingTravel?.stage]);

  useEffect(() => {
    if (
      pendingTravel?.stage !== 'walking'
      || pendingDestinationX === undefined
      || pendingDestinationX === pendingTravel.origin.x
    ) {
      return;
    }

    setWizardFacing(pendingDestinationX < pendingTravel.origin.x ? 'left' : 'right');
  }, [pendingDestinationX, pendingTravel?.origin.x, pendingTravel?.stage]);

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
      <header className="pixel-game-header z-30 grid min-h-22 grid-cols-[1fr_auto_1fr] items-center px-6 py-3">
        <div className="flex items-center gap-6 justify-self-start">
          <div className="w-44">
            <div className="mb-1 flex items-center justify-between text-xs uppercase text-[#fff8d8]">
              <span>Health</span>
              <span>{health} / {maxHealth}</span>
            </div>
            <div className="pixel-health-track" aria-label={`Health: ${health} of ${maxHealth}`}>
              <div
                className="pixel-health-fill pixel-health-fill--player"
                style={{ width: `${healthPercent}%` }}
              />
            </div>
          </div>
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
        <h1 className="pixel-section-title text-2xl justify-self-center">{regionName}</h1>
        <div className="flex items-center gap-3 justify-self-end">
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
        <motion.div
          className="absolute left-1/2 top-1/2"
          style={{
            transformOrigin: 'top left',
          }}
          initial={false}
          animate={{
            x: -cameraWorldPoint.x * MAP_SCALE,
            y: -cameraWorldPoint.y * MAP_SCALE,
            scale: MAP_SCALE,
          }}
          transition={pendingTravel?.stage === 'walking'
            ? { duration: wizardTravelDurationMs / 1000, ease: 'linear' }
            : { duration: 0 }}
        >
          {tiles.map((tile) => (
            <MapTile
              key={tile.key}
              map={map}
              tile={tile}
              reachableTargetKeys={reachableTargetKeys}
              eventResolveTarget={pendingTravel?.stage === 'event-resolve'
                ? pendingTravel.arrivalTarget
                : null}
              isTravelLocked={pendingTravel !== null}
              isRevealing={pendingTravel?.stage === 'tile-reveal'
                && pendingTravel.revealedTileKey === tile.key}
              onTravel={handleTravel}
              onCurrentMarker={handleCurrentMarker}
            />
          ))}
          <motion.img
            src={WIZARD_WALK_FRAMES[wizardFrameIndex]}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`pointer-events-none absolute z-20 h-[43px] w-8 max-w-none -translate-x-1/2 -translate-y-[78%] select-none [image-rendering:pixelated] drop-shadow-[2px_2px_0_#141313] ${wizardFacing === 'left' ? '-scale-x-100' : ''}`}
            initial={false}
            animate={{ left: wizardWorldPoint.x, top: wizardWorldPoint.y }}
            transition={pendingTravel?.stage === 'walking'
              ? { duration: wizardTravelDurationMs / 1000, ease: 'linear' }
              : { duration: 0 }}
          />
        </motion.div>
        <p className="sr-only" aria-live="polite">{announcement}</p>
      </section>
      <SacrificialAltarModal />
      <ArtefactEventModal />
    </div>
  );
}
