/**
 * Core game types for Runesmith
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
  score: number;
  deck: Rune[]; // Player's deck of runes for this run
}

/**
 * Turn phase
 */
export type TurnPhase = 'draft' | 'place' | 'end-of-round' | 'scoring' | 'game-over';

/**
 * Game mode
 */
export type GameMode = 'pvp' | 'pve';

/**
 * Main game state
 */
export interface GameState {
  players: [Player, Player]; // Two players
  factories: Factory[];
  centerPool: Rune[]; // Center factory (accumulates leftover runes)
  currentPlayerIndex: 0 | 1;
  turnPhase: TurnPhase;
  round: number;
  selectedRunes: Rune[]; // Runes currently selected by active player
  draftSource: { type: 'factory'; factoryId: string; movedToCenter: Rune[] } | { type: 'center' } | null; // Where the selected runes came from
  firstPlayerToken: 0 | 1 | null; // Which player has the first player token (null if in center)
  gameMode: GameMode; // PvP or PvE
}
