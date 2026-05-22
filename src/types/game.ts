/**
 * Core game types for Massive Spell: Arcane Arena
 */

import type { ArtefactId } from './artefacts';

/**
 * Rune types (elemental identities)
 */
export type RuneType = 'Fire' | 'Frost' | 'Life' | 'Void' | 'Wind' | 'Lightning';

/**
 * Rune effect modifiers
 */
export type RuneEffectRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type RuneEffect =
  | { type: 'Damage'; amount: number; rarity: RuneEffectRarity }
  | { type: 'Healing'; amount: number; rarity: RuneEffectRarity }
  | { type: 'Synergy'; amount: number; synergyType: RuneType; rarity: RuneEffectRarity }
  | { type: 'Fortune'; amount: number; rarity: RuneEffectRarity }
  | { type: 'Fragile'; amount: number; fragileType: RuneType; rarity: RuneEffectRarity }
  | { type: 'Channel'; amount: number; rarity: RuneEffectRarity }
  | { type: 'ChannelSynergy'; amount: number; synergyType: RuneType; rarity: RuneEffectRarity }
  | { type: 'Armor'; amount: number; rarity: RuneEffectRarity }
  | { type: 'ArmorSynergy'; amount: number; synergyType: RuneType; rarity: RuneEffectRarity }

export type RuneEffects = RuneEffect[];

/**
 * A rune in the game
 */
export interface Rune {
  id: string;
  runeType: RuneType;
  effects: RuneEffects;
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

export interface CombatZoneState {
  enemy: Enemy | null;
  combatPhase: CombatPhase;
  hand: Rune[];
  discardPile: Rune[];
  wallCharges: SpellWallCharge[][];
  selectedHandRuneId: string | null;
}

export type DeckDraftEffect =
  | { type: 'heal'; amount: number }
  | { type: 'maxHealth'; amount: number }
  | { type: 'betterRunes'; rarityStep: number };

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

/**
 * A runeforge containing runes to draft from
 */
export interface Runeforge {
  id: string;
  ownerId: Player['id'];
  runes: Rune[];
  deckDraftEffect?: DeckDraftEffect;
  disabled: boolean;
}

/**
 * Pattern line (1-5 tiers, each requiring matching runes to complete)
 */
export interface PatternLine {
  tier: 1 | 2 | 3 | 4 | 5 | 6; // Line capacity (1-6 runes)
  runeType: RuneType | null; // Type of rune in this line (null if empty)
  count: number; // Current number of runes in the line
  runes: Rune[]; // Exact runes placed on this line, in placement order
  primaryRuneId: string | null; // ID of the rune that will cast from this line
  primaryRuneEffects: RuneEffects | null; // Effects inherited by wall placement
  firstRuneId?: string | null; // Legacy persisted field migrated during hydration
  firstRuneEffects?: RuneEffects | null; // Legacy persisted field migrated during hydration
}

/**
 * A position in the scoring wall/grid
 */
export interface WallCell {
  runeType: RuneType | null; // null if empty
  effects: RuneEffects | null; // Effects inherited from the pattern line's first rune
}

/**
 * The scoring grid/wall
 */
export type ScoringWall = WallCell[][];

/**
 * Player state
 */
export interface Player {
  id: string;
  name: string;
  patternLines: PatternLine[];
  wall: ScoringWall;
  health: number; // Current health (starts at configurable amount)
  maxHealth: number; // Maximum health cap (initialized at game start)
  armor: number; // Temporary shield that absorbs damage before health
  deck: Rune[]; // Player's deck of runes for this run
}

/**
 * Turn phase
 */
export type TurnPhase = 'select' | 'resolving-end-round' | 'deck-draft';

/**
 * Animation state for rune movement
 */
export interface AnimatingRune {
  id: string;
  runeType: RuneType;
  rune: Rune;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size?: number;
  shouldDisappear?: boolean;
}

export interface ScoringStep {
  row: number;
  col: number;
  runeType: RuneType;
  damageDelta: number;
  healingDelta: number;
  arcaneDustDelta: number;
  armorDelta: number;
  delayMs: number;
}

export interface ScoringSequenceState {
  steps: ScoringStep[];
  activeIndex: number;
  sequenceId: number;
  startHealth: number;
  startArmor: number;
  startRunePowerTotal: number;
  startArcaneDust: number;
  maxHealth: number;
  displayHealth: number;
  displayArmor: number;
  displayRunePowerTotal: number;
  displayArcaneDust: number;
  targetHealth: number;
  targetArmor: number;
  targetRunePowerTotal: number;
  targetArcaneDust: number;
}

/**
 * Main game state
 */
export interface GameState {
  gameStarted: boolean; // Whether the game has been started (false shows start screen)
  runesPerRuneforge: number; // Number of runes dealt into each runeforge
  startingHealth: number; // Health pool per player for the current configuration
  overflowCapacity: number; // Floor line capacity that determines overflow penalties
  player: Player;
  fullDeck: Rune[]; // Blueprint deck for starting future solo games
  runeforges: Runeforge[];
  runeforgeDraftStage: 'single' | 'global';
  turnPhase: TurnPhase;
  gameIndex: number; // Current game in this run (increments after each deck draft)
  round: number; // Current round number within the active game run
  overloadDamage: number;
  startingStrain: number; // Configured strain at the start of the run
  overloadRunes: Rune[]; // Runes that have been overloaded (placed on floor) during this game
  animatingRunes: AnimatingRune[]; // Runes currently being animated
  pendingPlacement: { patternLineIndex: number } | { floor: true } | null; // Placement action pending animation completion
  scoringSequence: ScoringSequenceState | null; // Active scoring pulses/sequence
  overloadSoundPending: boolean; // Flag to trigger overload damage SFX during placement
  channelSoundPending: boolean; // Flag to trigger lightning SFX when channel effects resolve
  lockedPatternLines: number[]; // Pattern line indices locked until next round (solo toggle)
  shouldTriggerEndRound: boolean; // Compatibility flag used by the round resolver after scoring
  runePowerTotal: number; // Solo score accumulator
  targetScore: number; // Solo target score required for victory
  isDefeat: boolean; // Solo result
  patternLineLock: boolean; // Solo config toggle for locking completed pattern lines until next round
  longestRun: number; // Furthest game reached in any run
  deckDraftState: DeckDraftState | null; // Deck drafting flow after victory
  baseTargetScore: number; // Configured starting target for reset scenarios
  deckDraftReadyForNextGame: boolean; // Indicates deck draft is done and waiting for player to start next run
  activeArtefacts: ArtefactId[]; // Artefacts active for this game run
  enemy: Enemy | null;
  combatPhase: CombatPhase;
  hand: Rune[];
  discardPile: Rune[];
  wallCharges: SpellWallCharge[][];
  selectedHandRuneId: string | null;
}

export type DraftSource = {
      runeforgeId: string;
      originalRunes: Rune[];
      affectedRuneforges?: { runeforgeId: string; originalRunes: Rune[] }[];
      previousDisabledRuneforgeIds?: string[];
      previousRuneforgeDraftStage?: 'single' | 'global';
      selectionMode?: 'single' | 'global';
    }

export interface SelectionState {
  selectedRunes: Rune[]; // Runes currently selected by active player
  draftSource: DraftSource | null; // Where the selected runes came from (and original forge state)
  selectionTimestamp: number | null; // When the current selection was made (ms since epoch)
}

export interface DeckDraftState {
  runeforges: Runeforge[];
  picksRemaining: number;
  totalPicks: number;
  selectionLimit: number;
  selectionsThisOffer: number;
}
