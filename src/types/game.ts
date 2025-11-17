/**
 * Core game types for Massive Spell: Arcane Arena
 * Azul-inspired roguelite deck-building game
 */

/**
 * Rune types (elemental identities)
 */
export type RuneType = 'Fire' | 'Frost' | 'Poison' | 'Void' | 'Wind';

/**
 * Rune effect modifiers
 */
export type RuneEffect =
  | { type: 'PlusOne'; target: 'placement' }
  | { type: 'Double'; target: 'scoring' }
  | { type: 'MinusCost'; amount: number }
  | { type: 'None' };

/**
 * A rune in the game
 */
export interface Rune {
  id: string;
  runeType: RuneType;
  effect: RuneEffect;
}

/**
 * A factory containing runes to draft from
 */
export interface Factory {
  id: string;
  runes: Rune[];
}

/**
 * Pattern line (1-5 tiers, each requiring matching runes to complete)
 */
export interface PatternLine {
  tier: 1 | 2 | 3 | 4 | 5; // Line capacity (1, 2, 3, 4, or 5 runes)
  runeType: RuneType | null; // Type of rune in this line (null if empty)
  count: number; // Current number of runes in the line
}

/**
 * A position in the scoring wall/grid
 */
export interface WallCell {
  runeType: RuneType | null; // null if empty
}

/**
 * The 5x5 scoring grid/wall
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
 * Player type (human or AI)
 */
export type PlayerType = 'human' | 'ai';

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
  score: number; // Total damage taken (accumulated opponent spellpower)
  deck: Rune[]; // Player's deck of runes for this run
}

/**
 * Turn phase
 */
export type TurnPhase = 'draft' | 'place' | 'end-of-round' | 'scoring' | 'game-over';

/**
 * Scoring phase steps for visual feedback
 */
export type ScoringPhase = 'moving-to-wall' | 'calculating-score' | 'clearing-floor' | 'complete' | null;

/**
 * Round history entry for game log
 */
export interface RoundScore {
  round: number;
  playerName: string;
  playerEssence: number;
  playerFocus: number;
  playerTotal: number;
  opponentName: string;
  opponentEssence: number;
  opponentFocus: number;
  opponentTotal: number;
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
  gameMode: 'classic' | 'standard'; // Game mode: classic (no modifiers) or standard (with rune effects)
  players: [Player, Player]; // Player (index 0) and AI Opponent (index 1)
  factories: Factory[];
  centerPool: Rune[]; // Center factory (accumulates leftover runes)
  currentPlayerIndex: 0 | 1;
  turnPhase: TurnPhase;
  round: number;
  selectedRunes: Rune[]; // Runes currently selected by active player
  draftSource: { type: 'factory'; factoryId: string; movedToCenter: Rune[] } | { type: 'center' } | null; // Where the selected runes came from
  firstPlayerToken: 0 | 1 | null; // Which player has the first player token (null if in center)
  animatingRunes: AnimatingRune[]; // Runes currently being animated
  pendingPlacement: { patternLineIndex: number } | { floor: true } | null; // Placement action pending animation completion
  scoringPhase: ScoringPhase; // Current step in round-end scoring animation
  roundHistory: RoundScore[]; // History of completed rounds for game log
  voidEffectPending: boolean; // Whether Void effect is waiting for factory selection
  frostEffectPending: boolean; // Whether Frost effect is waiting for factory selection
  frozenFactories: string[]; // Factory IDs that are frozen (opponent cannot draft from them)
}
