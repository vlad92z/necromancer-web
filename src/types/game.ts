/**
 * Core game types for Massive Spell: Arcane Arena.
 */

import type { ArtefactId } from './artefacts';

export type RuneType = 'Fire' | 'Frost' | 'Life' | 'Void' | 'Wind' | 'Lightning';
export type RuneEffectRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type RuneSoundSignals = Record<RuneType, number>;

export type EffectId = string;
export type EffectParams = Record<string, unknown>;

export interface EffectRef {
  effectId: EffectId;
  params?: EffectParams;
}

export type EffectTrigger = 'onCast' | 'onEnemyAttack' | 'startTurn' | 'endTurn' | 'onDeckDraftOffer';
export type EffectSourceType = 'rune' | 'artefact';

export interface EffectResolutionLog {
  sourceType: EffectSourceType;
  sourceId: string;
  effectId: string;
  trigger: EffectTrigger;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  displayHint: string;
}

export interface Rune {
  id: string;
  name: string;
  runeTypes: RuneType[];
  rarity: RuneEffectRarity;
  cardImageSrc: string;
  tokenImageSrc: string;
  manaCost?: number;
  castEffectRefs: EffectRef[];
  passiveEffectRefs: EffectRef[];
}

export interface Enemy {
  id: string;
  name: string;
  imageSrc: string;
  health: number;
  maxHealth: number;
  armor?: number;
  arcaneDustRewardRange?: readonly [minimum: number, maximum: number];
}

export interface EnemyRune extends Rune {
  damage: number;
}

export type CombatPhase = 'player-turn' | 'enemy-turn' | 'victory' | 'defeat';

export interface DeckDraftOffer {
  id: string;
  ownerId: Player['id'];
  rune: Rune;
}

export interface DeckDraftState {
  offers: DeckDraftOffer[];
  selectedOffer: DeckDraftOffer | null;
  arcaneDustReward: number;
}

export type TooltipCardVariant = 'default' | 'nonPrimary';

export interface TooltipCard {
  id: string;
  runeType: RuneType;
  runeTypes: RuneType[];
  title: string;
  description: string;
  runeRarity?: RuneEffectRarity | null;
  imageSrc: string;
  manaCost: number;
  variant?: TooltipCardVariant;
}

export interface WallCell {
  id: string | null;
  name: string | null;
  acceptedRuneTypes: RuneType[];
  runeTypes: RuneType[];
  rarity: RuneEffectRarity | null;
  cardImageSrc: string | null;
  tokenImageSrc: string | null;
  manaCost?: number | null;
  castEffectRefs: EffectRef[] | null;
  passiveEffectRefs: EffectRef[] | null;
}

export type ScoringWall = WallCell[][];

export interface Player {
  id: string;
  name: string;
  wall: ScoringWall;
  health: number;
  maxHealth: number;
  armor: number;
  mana: number;
  maxMana: number;
  deck: Rune[];
}

export type SoloPhase = 'map' | 'encounter' | 'reward';
export type MapTileKind = 'start' | 'forest';
export type MapLocationId = 'start' | 'A' | 'B' | 'C' | 'D';
export type MapEncounterLocationId = Exclude<MapLocationId, 'start'>;
export type MapEncounterKind = 'fire';
export type MapRoadId =
  | 'left-75'
  | 'left-155'
  | 'top-75'
  | 'top-195'
  | 'right-75'
  | 'right-155'
  | 'bottom-75'
  | 'bottom-195';

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapEncounter {
  id: string;
  locationId: MapEncounterLocationId;
  kind: MapEncounterKind;
  cleared: boolean;
}

export interface MapTileState {
  key: string;
  x: number;
  y: number;
  kind: MapTileKind;
  encounters: Partial<Record<MapEncounterLocationId, MapEncounter>>;
}

export interface MapPlayerPosition {
  tileKey: string;
  locationId: MapLocationId;
}

export interface ActiveMapEncounter {
  id: string;
  tileKey: string;
  locationId: MapEncounterLocationId;
  kind: MapEncounterKind;
}

export interface SoloMapState {
  tiles: Record<string, MapTileState>;
  playerPosition: MapPlayerPosition;
  activeEncounter: ActiveMapEncounter | null;
}

export type MapTravelTarget =
  | {
    kind: 'location';
    tileKey: string;
    locationId: MapLocationId;
  }
  | {
    kind: 'road';
    tileKey: string;
    roadId: MapRoadId;
  };

export interface CombatZoneState {
  enemy: Enemy | null;
  combatPhase: CombatPhase;
  hand: Rune[];
  discardPile: Rune[];
  suppressedRunes: Rune[];
  selectedHandRuneId: string | null;
  enemyBoard: ScoringWall;
  enemyQueuedRunes: EnemyRune[];
  enemyTurnNumber: number;
}

export interface GameState extends CombatZoneState {
  gameStarted: boolean;
  soloPhase: SoloPhase;
  soloMap: SoloMapState;
  startingHealth: number;
  player: Player;
  fullDeck: Rune[];
  gameIndex: number;
  arcaneDust: number;
  enemyMaxHealth: number;
  isDefeat: boolean;
  longestRun: number;
  deckDraftState: DeckDraftState | null;
  activeArtefacts: ArtefactId[];
  runeSoundSignals: RuneSoundSignals;
  enemyAttackSoundSignal: number;
  shieldSoundSignal: number;
}
