/**
 * Core game types for Massive Spell: Arcane Arena.
 */

import type { ArtefactId } from './artefacts';

export type RuneType = 'Fire' | 'Frost' | 'Life' | 'Void' | 'Wind' | 'Lightning';
export type RuneEffectRarity = 'common' | 'uncommon' | 'rare' | 'epic';
/** Monotonic play counters keyed by the canonical sound URL of each spell. */
export type RuneSoundSignals = Record<string, number>;

export interface RuneSpellAnimation {
  frames: readonly string[];
  frameDurationMs: number;
}

export interface SpellAnimationEvent {
  sequence: number;
  animation: RuneSpellAnimation;
}

export type EffectId = string;
export type EffectParams = Record<string, unknown>;

export interface EffectRef {
  effectId: EffectId;
  params?: EffectParams;
}

export type RuneRemovalKind = 'consume' | 'destroy';
export type RuneRemovalSelection = 'manual' | 'random';
export type RuneRemovalTrigger = 'onCast' | 'onIncomingDamage' | 'startTurn' | 'endTurn';
export type RuneEffectTargetOwner = 'self' | 'opponent';

interface RuneTargetEffectRefBase {
  params?: never;
  selection: RuneRemovalSelection;
  targetOwner: RuneEffectTargetOwner;
  runeType?: RuneType;
  payload?: EffectRef;
}

export interface RuneConsumeEffectRef extends RuneTargetEffectRefBase {
  effectId: 'rune.consume';
  trigger: 'onCast';
}

export interface RuneDestroyEffectRef extends RuneTargetEffectRefBase {
  effectId: 'rune.destroy';
  trigger: RuneRemovalTrigger;
  count: number;
}

export type RuneRemovalEffectRef = RuneConsumeEffectRef | RuneDestroyEffectRef;

export type RuneEffectRef = EffectRef | RuneRemovalEffectRef;

export type EffectTrigger = 'onCast' | 'onIncomingDamage' | 'onRuneRemoved' | 'startTurn' | 'endTurn' | 'onDeckDraftOffer';
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
  spellAnimation?: RuneSpellAnimation;
  spellSound?: string;
  manaCost?: number;
  castEffectRefs: RuneEffectRef[];
  passiveEffectRefs: RuneEffectRef[];
}

export interface Enemy {
  id: string;
  name: string;
  imageSrc: string;
  isBoss?: boolean;
  health: number;
  maxHealth: number;
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
  runeTypes: RuneType[];
  rarity: RuneEffectRarity | null;
  cardImageSrc: string | null;
  tokenImageSrc: string | null;
  spellSound?: string | null;
  manaCost?: number | null;
  castEffectRefs: RuneEffectRef[] | null;
  passiveEffectRefs: RuneEffectRef[] | null;
  shield: number | null;
}

export type ScoringWall = WallCell[][];

export interface Player {
  id: string;
  name: string;
  wall: ScoringWall;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  deck: Rune[];
}

export type SoloPhase = 'map' | 'encounter' | 'reward';
export type MapTileKind = 'start' | 'forest';
export type MapLocationId = 'start' | 'A' | 'B' | 'C' | 'D';
export type MapEncounterLocationId = Exclude<MapLocationId, 'start'>;
export type RegionId = 'greenwood';
export type MapEventKind = 'combat' | 'boss' | 'healing' | 'sacrificial-altar' | 'artefact' | 'empty';
export type MonsterId = 'goblin' | 'witch' | 'shade' | 'golem-lord';
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

export interface MapLocationEvent {
  id: string;
  locationId: MapEncounterLocationId;
  tokenId: string | null;
  kind: MapEventKind;
  monsterId?: MonsterId;
  offeredArtefactId?: ArtefactId;
  arcaneDustReward?: number;
  cleared: boolean;
}

export interface MapTileState {
  key: string;
  x: number;
  y: number;
  kind: MapTileKind;
  events: Partial<Record<MapEncounterLocationId, MapLocationEvent>>;
}

export interface MapPlayerPosition {
  tileKey: string;
  locationId: MapLocationId;
}

export interface ActiveMapEncounter {
  id: string;
  tileKey: string;
  locationId: MapEncounterLocationId;
  monsterId: MonsterId;
}

export interface SoloMapState {
  regionId: RegionId;
  availableEventTokenIds: string[];
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
  /** Runes removed from the player's wall by destruction or Consume during this encounter. */
  playerDestroyedRunes: Rune[];
  /** Runes removed from the enemy wall by destruction or Consume during this encounter. */
  enemyDestroyedRunes: Rune[];
  suppressedRunes: Rune[];
  selectedHandRuneId: string | null;
  enemyBoard: ScoringWall;
  enemyQueuedRunes: EnemyRune[];
  enemyTurnNumber: number;
  pendingCombatResolution: PendingCombatResolution | null;
}

export interface WallPosition {
  row: number;
  col: number;
}

export interface PendingRuneTarget {
  sourceOwner: 'player' | 'enemy';
  sourceRuneId: string;
  sourcePosition: WallPosition;
  effectRef: RuneDestroyEffectRef;
}

export type PendingCombatContinuation =
  | {
    kind: 'cast';
    castRune: Rune;
    sourcePosition: WallPosition;
    remainingEffectRefs: RuneEffectRef[];
  }
  | {
    kind: 'endTurn';
    processedRemovalKeys: string[];
  }
  | {
    kind: 'startTurn';
    processedRemovalKeys: string[];
  };

export interface PendingCombatResolution {
  target: PendingRuneTarget;
  continuation: PendingCombatContinuation;
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
  isDefeat: boolean;
  isVictory: boolean;
  longestRun: number;
  deckDraftState: DeckDraftState | null;
  activeArtefacts: ArtefactId[];
  runeSoundSignals: RuneSoundSignals;
  spellAnimationEvent: SpellAnimationEvent | null;
  enemyAttackSoundSignal: number;
  shieldSoundSignal: number;
}
