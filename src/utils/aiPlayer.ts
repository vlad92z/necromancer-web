/**
 * AI Player logic - makes random legal moves
 */

import type { GameState, RuneType, PatternLine } from '../types/game';
import { getWallColumnForRune } from './scoring';

/**
 * Get all legal draft moves for the current AI player
 */
function getLegalDraftMoves(state: GameState): Array<{ type: 'factory' | 'center', factoryId?: string, runeType: RuneType }> {
  const moves: Array<{ type: 'factory' | 'center', factoryId?: string, runeType: RuneType }> = [];
  
  // Get unique rune types from factories
  state.factories.forEach(factory => {
    if (factory.runes.length > 0) {
      const runeTypes = new Set(factory.runes.map(r => r.runeType));
      runeTypes.forEach(runeType => {
        moves.push({ type: 'factory', factoryId: factory.id, runeType });
      });
    }
  });
  
  // Get unique rune types from center
  if (state.centerPool.length > 0) {
    const runeTypes = new Set(state.centerPool.map(r => r.runeType));
    runeTypes.forEach(runeType => {
      moves.push({ type: 'center', runeType });
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
 * Make a random legal move for the AI player
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
    const placementMoves = getLegalPlacementMoves(state);
    if (placementMoves.length === 0) return false;
    
    // Pick a random placement
    const move = placementMoves[Math.floor(Math.random() * placementMoves.length)];
    
    if (move.type === 'floor') {
      placeRunesInFloor();
    } else if (move.lineIndex !== undefined) {
      placeRunes(move.lineIndex);
    }
    
    return true;
  }
  
  // Otherwise, we need to draft runes
  const draftMoves = getLegalDraftMoves(state);
  if (draftMoves.length === 0) return false;
  
  // Pick a random draft move
  const move = draftMoves[Math.floor(Math.random() * draftMoves.length)];
  
  if (move.type === 'factory' && move.factoryId) {
    draftRune(move.factoryId, move.runeType);
  } else if (move.type === 'center') {
    draftFromCenter(move.runeType);
  }
  
  return true;
}
