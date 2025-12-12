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

export type RuneEffects = RuneEffect[];

/**
 * A rune in the game
 */
export interface Rune {
  id: string;
  runeType: RuneType;
  effects: RuneEffects;
}

export type DeckDraftEffect =
  | { type: 'heal'; amount: number }
  | { type: 'maxHealth'; amount: number }
  | { type: 'betterRunes'; rarityStep: number };

export interface TooltipCard {
  id: string;
  runeType: RuneType;
  title: string;
  description: string;
  imageSrc?: string;
}

/**
 * A runeforge containing runes to draft from
 */
export interface Runeforge {
  id: string;
  ownerId: Player['id'];
  runes: Rune[];
  deckDraftEffect?: DeckDraftEffect;
  disabled?: boolean;
}

/**
 * Pattern line (1-5 tiers, each requiring matching runes to complete)
 */
export interface PatternLine {
  tier: 1 | 2 | 3 | 4 | 5 | 6; // Line capacity (1-6 runes)
  runeType: RuneType | null; // Type of rune in this line (null if empty)
  count: number; // Current number of runes in the line
  firstRuneId: string | null; // ID of the first rune placed on this line TODO Rename to Primary Rune
  firstRuneEffects: RuneEffects | null; // Effects inherited by wall placement
}

/**
 * Cell state for direct placement on spell wall
 */
export type WallCellState = 'Empty' | 'InProgress' | 'Completed';

/**
 * A position in the scoring wall/grid
 */
export interface WallCell {
  runeType: RuneType | null; // null if empty or InProgress with no primary rune yet
  effects: RuneEffects | null; // Effects inherited from the primary rune
  // New fields for direct placement model:
  placedCount: number; // Number of runes placed in this cell
  primaryRuneId: string | null; // ID of the primary (first) rune placed
  locked: boolean; // Whether this cell is locked (cannot be interacted with)
}

/**
 * The scoring grid/wall
 */
export type ScoringWall = WallCell[][];

/**
 * Floor line (penalty area for overflow runes)
 */
export interface FloorLine {
  runes: Rune[];
  maxCapacity: number;
}

/**
 * Solo run configuration values entered on the start screen
 */
export interface RunConfig {
  startingHealth: number;
  startingStrain: number;
  strainMultiplier: number;
  factoriesPerPlayer: number;
  deckRunesPerType: number;
  targetRuneScore: number;
  runeScoreTargetIncrement: number;
  victoryDraftPicks: number;
  patternLinesLockOnComplete: boolean;
}

/**
 * Solo game ending state
 */
export type GameOutcome = 'victory' | 'defeat' | null;

/**
 * Player state
 */
export interface Player {
  id: string;
  name: string;
  patternLines: PatternLine[];
  wall: ScoringWall;
  floorLine: FloorLine;
  health: number; // Current health (starts at configurable amount)
  maxHealth?: number; // Maximum health cap (initialized at game start)
  deck: Rune[]; // Player's deck of runes for this run
}

/**
 * Turn phase
 */
export type TurnPhase = 'select' | 'place' | 'cast' | 'scoring' | 'end-of-round' | 'deck-draft' | 'game-over';

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
  delayMs: number;
}

export interface ScoringSequenceState {
  steps: ScoringStep[];
  activeIndex: number;
  sequenceId: number;
}

/**
 * Main game state
 */
export interface GameState {
  gameStarted: boolean; // Whether the game has been started (false shows start screen)
  factoriesPerPlayer: number; // Runeforge count for the current solo setup
  runesPerRuneforge: number; // Number of runes dealt into each runeforge
  startingHealth: number; // Health pool per player for the current configuration
  overflowCapacity: number; // Floor line capacity that determines overflow penalties
  player: Player;
  soloDeckTemplate: Rune[]; // Blueprint deck for starting future solo games
  runeforges: Runeforge[];
  centerPool: Rune[]; // Center runeforge (accumulates leftover runes)
  runeforgeDraftStage: 'single' | 'global';
  tooltipCards: TooltipCard[]; // Cards displayed in the tooltip view
  turnPhase: TurnPhase;
  game: number; // Current game in this run (increments after each deck draft)
  /**
   * Damage dealt for every overload rune, derived from the current game number.
   * Progression caps at the final configured value for later games.
   */
  strain: number;
  /**
   * Reserved for potential future tuning of overload scaling.
   */
  strainMultiplier: number;
  startingStrain: number; // Configured strain at the start of the run
  selectedRunes: Rune[]; // Runes currently selected by active player
  overloadRunes: Rune[]; // Runes that have been overloaded (placed on floor) during this game
  draftSource:
    | {
        type: 'runeforge';
        runeforgeId: string;
        movedToCenter: Rune[];
        originalRunes: Rune[];
        affectedRuneforges?: { runeforgeId: string; originalRunes: Rune[] }[];
        previousDisabledRuneforgeIds?: string[];
        previousRuneforgeDraftStage?: 'single' | 'global';
        selectionMode?: 'single' | 'global';
      }
    | { type: 'center'; originalRunes: Rune[] }
    | null; // Where the selected runes came from (and original forge state)
  animatingRunes: AnimatingRune[]; // Runes currently being animated
  pendingPlacement: { patternLineIndex: number } | { floor: true } | null; // Placement action pending animation completion
  scoringSequence: ScoringSequenceState | null; // Active scoring pulses/sequence
  overloadSoundPending: boolean; // Flag to trigger overload damage SFX during placement
  selectionTimestamp: number | null; // When the current selection was made (ms since epoch)
  lockedPatternLines: Record<Player['id'], number[]>; // Pattern line indices locked until next round (solo toggle)
  shouldTriggerEndRound: boolean; // Flag to trigger endround in component useEffect
  runePowerTotal: number; // Solo score accumulator
  targetScore: number; // Solo target score required for victory
  runeScoreTargetIncrement: number; // Score increase applied after each victory
  outcome: GameOutcome; // Solo result (victory/defeat)
  patternLineLock: boolean; // Solo config toggle for locking completed pattern lines until next round
  longestRun: number; // Furthest game reached in any run
  deckDraftState: DeckDraftState | null; // Deck drafting flow after victory
  baseTargetScore: number; // Configured starting target for reset scenarios
  deckDraftReadyForNextGame: boolean; // Indicates deck draft is done and waiting for player to start next run
  activeArtefacts: ArtefactId[]; // Artefacts active for this game run
  victoryDraftPicks: number; // Number of draft picks granted after a victory
}

export interface DeckDraftState {
  runeforges: Runeforge[];
  picksRemaining: number;
  totalPicks: number;
}
