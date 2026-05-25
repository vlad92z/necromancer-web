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
  runeType: RuneType;
  rarity: RuneEffectRarity;
  castEffectRefs: EffectRef[];
  passiveEffectRefs: EffectRef[];
}

export type EnemyIntent = { type: 'Attack'; amount: number };

export interface Enemy {
  id: string;
  name: string;
  imageSrc: string;
  health: number;
  maxHealth: number;
  intent: EnemyIntent;
}

export type CombatPhase = 'player-turn' | 'enemy-turn' | 'victory' | 'defeat';

export interface SpellWallCharge {
  row: number;
  col: number;
  runeType: RuneType;
  requiredCount: number;
  currentCount: number;
  spentRunes: Rune[];
  completedRuneId: string | null;
}

export type DeckDraftEffect =
  | { type: 'heal'; amount: number }
  | { type: 'maxHealth'; amount: number }
  | { type: 'betterRunes'; rarityStep: number };

export interface DeckDraftOffer {
  id: string;
  ownerId: Player['id'];
  runes: Rune[];
  deckDraftEffect?: DeckDraftEffect;
}

export interface DeckDraftState {
  offers: DeckDraftOffer[];
  picksRemaining: number;
  totalPicks: number;
  selectionLimit: number;
  selectionsThisOffer: number;
}

export type TooltipCardVariant = 'default' | 'nonPrimary';

export interface TooltipCard {
  id: string;
  runeType: RuneType;
  title: string;
  description: string;
  runeRarity?: RuneEffectRarity | null;
  imageSrc?: string;
  variant?: TooltipCardVariant;
}

export interface WallCell {
  runeType: RuneType | null;
  rarity: RuneEffectRarity | null;
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
  wallCharges: SpellWallCharge[][];
  selectedHandRuneId: string | null;
}

export interface GameState extends CombatZoneState {
  gameStarted: boolean;
  startingHealth: number;
  player: Player;
  fullDeck: Rune[];
  gameIndex: number;
  enemyMaxHealth: number;
  enemyAttackDamage: number;
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
