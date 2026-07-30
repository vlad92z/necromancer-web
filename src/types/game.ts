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
}

export interface EnemyRune extends Rune {
  damage: number;
}

export type CombatPhase = 'player-turn' | 'enemy-turn' | 'victory' | 'defeat';

export interface DeckDraftOffer {
  id: string;
  ownerId: Player['id'];
  runeType: RuneType;
  displayRarity: RuneEffectRarity;
  runes: Rune[];
}

export interface DeckDraftState {
  offers: DeckDraftOffer[];
  picksRemaining: number;
  totalPicks: number;
  selectedOffer: DeckDraftOffer | null;
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
  deck: Rune[];
}

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
  startingHealth: number;
  player: Player;
  fullDeck: Rune[];
  gameIndex: number;
  enemyMaxHealth: number;
  baseEnemyMaxHealth: number;
  isDefeat: boolean;
  longestRun: number;
  deckDraftState: DeckDraftState | null;
  deckDraftReadyForNextGame: boolean;
  activeArtefacts: ArtefactId[];
  runeSoundSignals: RuneSoundSignals;
  enemyAttackSoundSignal: number;
  shieldSoundSignal: number;
}
