/**
 * Core game types for Massive Spell: Arcane Arena
 */

/**
 * Rune types (elemental identities)
 */
export type RuneType = 'Fire' | 'Frost' | 'Life' | 'Void' | 'Wind' | 'Lightning';

/**
 * Number of rune types in the game
 * 3 types: Fire, Life, Wind (3x3 wall, 3 pattern lines)
 * 4 types: Fire, Life, Wind, Frost (4x4 wall, 4 pattern lines)
 * 5 types: Fire, Life, Wind, Frost, Void (5x5 wall, 5 pattern lines)
 * 6 types: Fire, Life, Wind, Frost, Void, Lightning (6x6 wall, 6 pattern lines)
 */
export type RuneTypeCount = 3 | 4 | 5 | 6;

/**
 * Rune effect modifiers
 */
export type RuneEffectRarity = 'uncommon' | 'rare' | 'epic';

export type RuneEffect =
  | { type: 'Damage'; amount: number; rarity: RuneEffectRarity }
  | { type: 'Healing'; amount: number; rarity: RuneEffectRarity }

export type RuneEffects = RuneEffect[];

/**
 * A rune in the game
 */
export interface Rune {
  id: string;
  runeType: RuneType;
  effects: RuneEffects;
}

/**
 * A runeforge containing runes to draft from
 */
export interface Runeforge {
  id: string;
  ownerId: Player['id'];
  runes: Rune[];
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
 * Floor line (penalty area for overflow runes)
 */
export interface FloorLine {
  runes: Rune[];
  maxCapacity: number;
}

/**
 * Solo run configuration values entered on the start screen
 */
export interface SoloRunConfig {
  startingHealth: number;
  startingStrain: number;
  strainMultiplier: number;
  factoriesPerPlayer: number;
  deckRunesPerType: number;
  targetRuneScore: number;
  patternLinesLockOnComplete: boolean;
}

/**
 * Solo game ending state
 */
export type SoloOutcome = 'victory' | 'defeat' | null;

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
export type TurnPhase = 'draft' | 'place' | 'cast' | 'end-of-round' | 'deck-draft' | 'game-over';

/**
 * Round history entry for game log
 */
export interface RoundScore {
  round: number;
  playerName: string;
}

/**
 * Animation state for rune movement
 */
export interface AnimatingRune {
  id: string;
  runeType: RuneType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Main game state
 */
export interface GameState {
  gameStarted: boolean; // Whether the game has been started (false shows start screen)
  runeTypeCount: RuneTypeCount; // Number of rune types (3, 4, or 5)
  factoriesPerPlayer: number; // Runeforge count per player (quick play config)
  runesPerRuneforge: number; // Number of runes dealt into each runeforge
  startingHealth: number; // Health pool per player for the current configuration
  overflowCapacity: number; // Floor line capacity that determines overflow penalties
  player: Player;
  soloDeckTemplate: Rune[]; // Blueprint deck for starting future solo games (empty for versus)
  runeforges: Runeforge[];
  centerPool: Rune[]; // Center runeforge (accumulates leftover runes)
  turnPhase: TurnPhase;
  round: number;
  /**
   * Damage dealt for every overload rune
   * Starts at a tunable value and is multiplied each round by `strainMultiplier`.
   */
  strain: number;
  /**
   * Factor used to multiply `strain` at the end of each round. Kept in state
   * so it can be tuned or modified by runes in the future.
   */
  strainMultiplier: number;
  soloStartingStrain: number; // Configured strain at the start of the run
  selectedRunes: Rune[]; // Runes currently selected by active player
  draftSource:
    | { type: 'runeforge'; runeforgeId: string; movedToCenter: Rune[]; originalRunes: Rune[] }
    | { type: 'center'; originalRunes: Rune[] }
    | null; // Where the selected runes came from (and original forge state)
  animatingRunes: AnimatingRune[]; // Runes currently being animated
  pendingPlacement: { patternLineIndex: number } | { floor: true } | null; // Placement action pending animation completion
  overloadSoundPending: boolean; // Flag to trigger overload damage SFX during placement
  roundHistory: RoundScore[]; // History of completed rounds for game log
  roundDamage: number; // Damage dealt by the player during the current round
  lockedPatternLines: Record<Player['id'], number[]>; // Pattern line indices locked until next round (solo toggle)
  shouldTriggerEndRound: boolean; // Flag to trigger endRound in component useEffect
  runePowerTotal: number; // Solo score accumulator
  soloTargetScore: number; // Solo target score required for victory
  soloOutcome: SoloOutcome; // Solo result (victory/defeat)
  soloPatternLineLock: boolean; // Solo config toggle for locking completed pattern lines until next round
  soloWinStreak: number; // Consecutive solo victories used for draft bonuses
  deckDraftState: DeckDraftState | null; // Deck drafting flow after victory
  soloBaseTargetScore: number; // Configured starting target for reset scenarios
  deckDraftReadyForNextGame: boolean; // Indicates deck draft is done and waiting for player to start next run
}

export interface DeckDraftState {
  runeforges: Runeforge[];
  picksRemaining: number;
  totalPicks: number;
}
