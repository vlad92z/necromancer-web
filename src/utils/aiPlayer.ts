/**
 * AI Player logic - implements smart strategies
 * Simple strategies:
 * 1. Prioritize completing pattern lines
 * 2. Avoid floor line penalties
 * 3. Block opponent's progress
 * 4. Maximize wall connection points
 */

import type { GameState, RuneType, PatternLine, Player } from '../types/game';
import { getWallColumnForRune } from './scoring';

interface DraftMove {
  type: 'factory' | 'center';
  factoryId?: string;
  runeType: RuneType;
  count: number; // Number of runes that will be drafted
}

/**
 * Count runes of a specific type in a location
 */
function countRunes(runes: Array<{ runeType: RuneType }>, runeType: RuneType): number {
  return runes.filter(r => r.runeType === runeType).length;
}

/**
 * Get all legal draft moves for the current AI player with rune counts
 */
function getLegalDraftMoves(state: GameState): DraftMove[] {
  const moves: DraftMove[] = [];
  
  // Get unique rune types from factories with counts
  state.factories.forEach(factory => {
    if (factory.runes.length > 0) {
      const runeTypes = new Set(factory.runes.map(r => r.runeType));
      runeTypes.forEach(runeType => {
        moves.push({ 
          type: 'factory', 
          factoryId: factory.id, 
          runeType,
          count: countRunes(factory.runes, runeType)
        });
      });
    }
  });
  
  // Get unique rune types from center with counts
  if (state.centerPool.length > 0) {
    const runeTypes = new Set(state.centerPool.map(r => r.runeType));
    runeTypes.forEach(runeType => {
      moves.push({ 
        type: 'center', 
        runeType,
        count: countRunes(state.centerPool, runeType)
      });
    });
  }
  
  return moves;
}

/**
 * Check if a pattern line can accept a specific rune type
 */
function canPlaceOnLine(line: PatternLine, runeType: RuneType, wall: any, lineIndex: number): boolean {
  // Check if line is already full
  if (line.count >= line.tier) return false;
  
  // Check if line is empty or has same type
  if (line.runeType !== null && line.runeType !== runeType) return false;
  
  // Check if this rune type is already on the wall in this row
  const col = getWallColumnForRune(lineIndex, runeType);
  if (wall[lineIndex][col].runeType !== null) return false;
  
  return true;
}

/**
 * Calculate how many adjacent runes a placement would create
 */
function calculateConnectionScore(wall: any, row: number, col: number): number {
  let connections = 0;
  
  // Check horizontal connections
  if (col > 0 && wall[row][col - 1].runeType !== null) connections++;
  if (col < 4 && wall[row][col + 1].runeType !== null) connections++;
  
  // Check vertical connections
  if (row > 0 && wall[row - 1][col].runeType !== null) connections++;
  if (row < 4 && wall[row + 1][col].runeType !== null) connections++;
  
  return connections;
}

/**
 * Score a draft move based on:
 * 1. Completing pattern lines (highest priority)
 * 2. Avoiding wasted runes (minimize overflow to floor)
 * 3. Blocking opponent's almost-complete lines
 * 4. Maximizing wall connection potential
 */
function scoreDraftMove(move: DraftMove, state: GameState): number {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const opponent = state.players[1 - state.currentPlayerIndex];
  let score = 0;
  
  // Find best line this move could fill
  let bestLineValue = 0;
  let minWaste = move.count;
  
  currentPlayer.patternLines.forEach((line, lineIndex) => {
    if (canPlaceOnLine(line, move.runeType, currentPlayer.wall, lineIndex)) {
      const spacesNeeded = line.tier - line.count;
      const waste = Math.max(0, move.count - spacesNeeded);
      
      // Strategy 1: Prioritize completing lines
      if (move.count >= spacesNeeded) {
        // Calculate connection bonus for this placement
        const col = getWallColumnForRune(lineIndex, move.runeType);
        const connectionBonus = calculateConnectionScore(currentPlayer.wall, lineIndex, col);
        bestLineValue = Math.max(bestLineValue, 100 + (line.tier * 10) + (connectionBonus * 20));
      } else {
        // Filling towards completion (higher tier = better)
        bestLineValue = Math.max(bestLineValue, 50 + (line.tier * 5) + move.count);
      }
      
      minWaste = Math.min(minWaste, waste);
    }
  });
  
  score += bestLineValue;
  
  // Strategy 2: Avoid floor penalties (penalize wasted runes)
  score -= minWaste * 15;
  
  // Strategy 3: Block opponent's progress
  opponent.patternLines.forEach((line) => {
    if (line.runeType === move.runeType && line.count > 0) {
      const spacesNeeded = line.tier - line.count;
      // If opponent is close to completing this line, blocking is valuable
      if (spacesNeeded <= 2) {
        score += 30; // Bonus for blocking opponent
      }
    }
  });
  
  return score;
}

/**
 * Choose best draft move using smart strategies
 */
function chooseBestDraftMove(state: GameState): DraftMove | null {
  const moves = getLegalDraftMoves(state);
  if (moves.length === 0) return null;
  
  // Score all moves
  const scoredMoves = moves.map(move => ({
    move,
    score: scoreDraftMove(move, state)
  }));
  
  // Sort by score (highest first)
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // Add some randomness: pick from top 3 moves
  const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
  const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
  
  return selectedMove.move;
}

/**
 * Score a placement move based on:
 * 1. Avoid floor line (highest priority)
 * 2. Prefer lines that will complete
 * 3. Prefer higher tiers
 * 4. Maximize wall connections
 */
function scorePlacementMove(
  lineIndex: number | null, 
  state: GameState
): number {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const runeCount = state.selectedRunes.length;
  
  // Floor placement (last resort)
  if (lineIndex === null) {
    return -100; // Strongly avoid floor
  }
  
  const line = currentPlayer.patternLines[lineIndex];
  const spacesAvailable = line.tier - line.count;
  let score = 0;
  
  // Strategy 1: Prefer moves that don't overflow to floor
  if (runeCount <= spacesAvailable) {
    score += 100; // Big bonus for no waste
  } else {
    const waste = runeCount - spacesAvailable;
    score -= waste * 20; // Penalize overflow
  }
  
  // Strategy 2: Prefer completing lines
  if (runeCount >= spacesAvailable) {
    const runeType = state.selectedRunes[0].runeType;
    const col = getWallColumnForRune(lineIndex, runeType);
    const connectionBonus = calculateConnectionScore(currentPlayer.wall, lineIndex, col);
    score += 50 + (connectionBonus * 15); // Bonus for completion + connections
  }
  
  // Strategy 3: Prefer higher tier lines (more points potential)
  score += line.tier * 5;
  
  return score;
}

/**
 * Get all legal placement moves for selected runes
 */
function getLegalPlacementMoves(state: GameState): Array<{ type: 'line' | 'floor', lineIndex?: number }> {
  const moves: Array<{ type: 'line' | 'floor', lineIndex?: number }> = [];
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  if (state.selectedRunes.length === 0) return moves;
  
  const runeType = state.selectedRunes[0].runeType;
  
  // Check each pattern line
  currentPlayer.patternLines.forEach((line, index) => {
    if (canPlaceOnLine(line, runeType, currentPlayer.wall, index)) {
      moves.push({ type: 'line', lineIndex: index });
    }
  });
  
  // Always allow placing in floor line
  moves.push({ type: 'floor' });
  
  return moves;
}

/**
 * Choose best placement move using smart strategies
 */
function chooseBestPlacementMove(state: GameState): { type: 'line' | 'floor', lineIndex?: number } | null {
  const moves = getLegalPlacementMoves(state);
  if (moves.length === 0) return null;
  
  // Score all moves
  const scoredMoves = moves.map(move => ({
    move,
    score: scorePlacementMove(move.lineIndex ?? null, state)
  }));
  
  // Sort by score (highest first)
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // Pick best move (with small chance of picking second best for variety)
  if (scoredMoves.length > 1 && Math.random() < 0.15) {
    return scoredMoves[1].move;
  }
  
  return scoredMoves[0].move;
}

/**
 * Make a smart move for the AI player
 * Returns true if a move was made, false if no legal moves available
 */
export function makeAIMove(
  state: GameState,
  draftRune: (factoryId: string, runeType: RuneType) => void,
  draftFromCenter: (runeType: RuneType) => void,
  placeRunes: (lineIndex: number) => void,
  placeRunesInFloor: () => void
): boolean {
  // If we have selected runes, we need to place them
  if (state.selectedRunes.length > 0) {
    const move = chooseBestPlacementMove(state);
    if (!move) return false;
    
    if (move.type === 'floor') {
      placeRunesInFloor();
    } else if (move.lineIndex !== undefined) {
      placeRunes(move.lineIndex);
    }
    
    return true;
  }
  
  // Otherwise, we need to draft runes
  const move = chooseBestDraftMove(state);
  if (!move) return false;
  
  if (move.type === 'factory' && move.factoryId) {
    draftRune(move.factoryId, move.runeType);
  } else if (move.type === 'center') {
    draftFromCenter(move.runeType);
  }
  
  return true;
}
