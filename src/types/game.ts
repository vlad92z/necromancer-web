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
 * Selection target for the Void effect
 */
export type VoidTarget =
  | { source: 'runeforge'; runeforgeId: Runeforge['id']; runeId: Rune['id'] }
  | { source: 'center'; runeId: Rune['id'] };

/**
 * Pattern line (1-5 tiers, each requiring matching runes to complete)
 */
export interface PatternLine {
  tier: 1 | 2 | 3 | 4 | 5 | 6; // Line capacity (1-6 runes)
  runeType: RuneType | null; // Type of rune in this line (null if empty)
  count: number; // Current number of runes in the line
  firstRuneId: string | null; // ID of the first rune placed on this line
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
 * Player type (human or computer-controlled)
 */
export type PlayerType = 'human' | 'computer';

/**
 * AI difficulty levels
 */
export type AIDifficulty = 'easy' | 'normal' | 'hard';

/**
 * Player side on the board
 */
export type PlayerSide = 'top' | 'bottom';

/**
 * Game match type
 */
export type MatchType = 'versus' | 'solo';

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
 * Controller type for a player seat
 */
export type PlayerController =
  | { type: 'human' }
  | { type: 'computer'; difficulty: AIDifficulty };

/**
 * Controller configuration for both player seats
 */
export type PlayerControllers = Record<PlayerSide, PlayerController>;

/**
 * Quick play opponent selection
 */
export type QuickPlayOpponent = AIDifficulty | 'human';

/**
 * Difficulty type alias for spectator mode
 */
export type Difficulty = AIDifficulty;

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
  type: PlayerType;
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
  opponentName: string;
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
 * Note: Only PvE (Player vs AI) mode is supported
 */
export interface GameState {
  gameStarted: boolean; // Whether the game has been started (false shows start screen)
  matchType: MatchType; // Game variant: traditional duel or solo run
  runeTypeCount: RuneTypeCount; // Number of rune types (3, 4, or 5)
  factoriesPerPlayer: number; // Runeforge count per player (quick play config)
  totalRunesPerPlayer: number; // Deck size for the quick play packet
  runesPerRuneforge: number; // Number of runes dealt into each runeforge
  startingHealth: number; // Health pool per player for the current configuration
  overflowCapacity: number; // Floor line capacity that determines overflow penalties
  playerControllers: PlayerControllers; // Controller assignments for top and bottom players
  players: [Player, Player]; // Bottom player (index 0) and top player (index 1)
  soloDeckTemplate: Rune[]; // Blueprint deck for starting future solo games (empty for versus)
  runeforges: Runeforge[];
  centerPool: Rune[]; // Center runeforge (accumulates leftover runes)
  currentPlayerIndex: 0 | 1;
  turnPhase: TurnPhase;
  round: number;
  /**
   * Strain multiplier applied to overload at round end (configurable)
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
  firstPlayerToken: 0 | 1 | null; // Which player has the first player token (null if in center)
  animatingRunes: AnimatingRune[]; // Runes currently being animated
  pendingPlacement: { patternLineIndex: number } | { floor: true } | null; // Placement action pending animation completion
  overloadSoundPending: boolean; // Flag to trigger overload damage SFX during placement
  roundHistory: RoundScore[]; // History of completed rounds for game log
  roundDamage: [number, number]; // Damage dealt by each player during the current round
  voidEffectPending: boolean; // Whether Void effect is waiting for rune destruction selection
  frostEffectPending: boolean; // Whether Frost effect is waiting for pattern line selection
  frozenPatternLines: Record<Player['id'], number[]>; // Pattern line indices frozen for each player
  lockedPatternLines: Record<Player['id'], number[]>; // Pattern line indices locked until next round (solo toggle)
  shouldTriggerEndRound: boolean; // Flag to trigger endRound in component useEffect
  runePowerTotal: number; // Solo score accumulator
  soloTargetScore: number; // Solo target score required for victory
  soloOutcome: SoloOutcome; // Solo result (victory/defeat)
  soloPatternLineLock: boolean; // Solo config toggle for locking completed pattern lines until next round
  soloWinStreak: number; // Consecutive solo victories used for draft bonuses
  deckDraftState: DeckDraftState | null; // Deck drafting flow after victory
  soloBaseTargetScore: number; // Configured starting target for reset scenarios
}

export interface DeckDraftState {
  runeforges: Runeforge[];
  picksRemaining: number;
  totalPicks: number;
}
