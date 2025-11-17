/**
 * AI Player logic - implements smart strategies
 * Simple strategies:
 * 1. Prioritize completing pattern lines
 * 2. Avoid floor line penalties
 * 3. Block opponent's progress
 * 4. Maximize wall connection points
 * 
 * Medium complexity strategies:
 * 5. Look-ahead planning (consider future rune availability)
 * 6. Value higher tier lines (tier 5 = more points potential)
 * 7. Avoid wasted runes (minimize overflow to floor)
 * 
 * Advanced strategies:
 * 8. Minimax algorithm (evaluate multiple moves ahead)
 * 9. Scoring simulation (calculate expected points for each move)
 */

import type { GameState, RuneType, PatternLine, Player } from '../types/game';
import { getWallColumnForRune, calculateWallPower } from './scoring';

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
 * MEDIUM COMPLEXITY: Calculate future rune availability after this draft
 * Returns a map of how many runes of each type will remain available
 */
function calculateFutureAvailability(state: GameState, move: DraftMove): Map<RuneType, number> {
  const availability = new Map<RuneType, number>();
  
  // Count all runes currently available
  state.factories.forEach(factory => {
    factory.runes.forEach(rune => {
      availability.set(rune.runeType, (availability.get(rune.runeType) || 0) + 1);
    });
  });
  
  state.centerPool.forEach(rune => {
    availability.set(rune.runeType, (availability.get(rune.runeType) || 0) + 1);
  });
  
  // Subtract the runes we're drafting
  availability.set(move.runeType, (availability.get(move.runeType) || 0) - move.count);
  
  // If drafting from factory, other runes will move to center (still available for opponent)
  // This doesn't change total availability, just location
  
  return availability;
}

/**
 * MEDIUM COMPLEXITY: Evaluate if we have incomplete pattern lines that need this rune type
 */
function evaluatePatternLineNeeds(player: { patternLines: PatternLine[] }): Map<RuneType, number> {
  const needs = new Map<RuneType, number>();
  
  player.patternLines.forEach((line) => {
    if (line.runeType !== null && line.count < line.tier) {
      // This line needs more runes of its type
      const spacesNeeded = line.tier - line.count;
      const currentNeed = needs.get(line.runeType) || 0;
      
      // Weight by tier (higher tiers = more valuable to complete)
      const weightedNeed = spacesNeeded * (1 + line.tier * 0.2);
      needs.set(line.runeType, currentNeed + weightedNeed);
    }
  });
  
  return needs;
}

/**
 * MEDIUM COMPLEXITY: Calculate waste efficiency score
 * Penalizes drafting more runes than can be efficiently used
 */
function calculateWasteEfficiency(
  move: DraftMove, 
  player: { patternLines: PatternLine[], wall: any }, 
  runeType: RuneType
): number {
  let bestEfficiency = -100; // Default: all runes wasted
  
  player.patternLines.forEach((line, lineIndex) => {
    if (canPlaceOnLine(line, runeType, player.wall, lineIndex)) {
      const spacesAvailable = line.tier - line.count;
      const wastedRunes = Math.max(0, move.count - spacesAvailable);
      const usedRunes = Math.min(move.count, spacesAvailable);
      
      // Efficiency = (used runes / total runes) * 100, minus waste penalty
      const efficiency = (usedRunes / move.count) * 100 - (wastedRunes * 25);
      bestEfficiency = Math.max(bestEfficiency, efficiency);
    }
  });
  
  return bestEfficiency;
}

/**
 * ADVANCED: Deep copy a player state for simulation
 */
function clonePlayer(player: Player): Player {
  return {
    ...player,
    patternLines: player.patternLines.map(line => ({ ...line })),
    wall: player.wall.map(row => row.map(cell => ({ ...cell }))),
    floorLine: {
      ...player.floorLine,
      runes: [...player.floorLine.runes]
    },
    deck: [...player.deck]
  };
}

/**
 * ADVANCED: Simulate a draft move and return the new game state
 */
function simulateDraftMove(state: GameState, move: DraftMove, targetLineIndex: number | null): GameState {
  const newState: GameState = {
    ...state,
    players: [clonePlayer(state.players[0]), clonePlayer(state.players[1])],
    factories: state.factories.map(f => ({ ...f, runes: [...f.runes] })),
    centerPool: [...state.centerPool],
    selectedRunes: []
  };
  
  const currentPlayer = newState.players[newState.currentPlayerIndex];
  let runesToPlace: { runeType: RuneType }[] = [];
  
  // Execute draft
  if (move.type === 'factory' && move.factoryId) {
    const factory = newState.factories.find(f => f.id === move.factoryId);
    if (factory) {
      runesToPlace = factory.runes.filter(r => r.runeType === move.runeType);
      const remainingRunes = factory.runes.filter(r => r.runeType !== move.runeType);
      newState.centerPool.push(...remainingRunes);
      factory.runes = [];
    }
  } else if (move.type === 'center') {
    runesToPlace = newState.centerPool.filter(r => r.runeType === move.runeType);
    newState.centerPool = newState.centerPool.filter(r => r.runeType !== move.runeType);
  }
  
  // Execute placement
  if (targetLineIndex !== null && targetLineIndex >= 0 && targetLineIndex < 5) {
    const line = currentPlayer.patternLines[targetLineIndex];
    const spacesAvailable = line.tier - line.count;
    const runesToAdd = Math.min(runesToPlace.length, spacesAvailable);
    const overflow = runesToPlace.length - runesToAdd;
    
    line.runeType = move.runeType;
    line.count += runesToAdd;
    
    if (overflow > 0) {
      // Add overflow to floor line (simplified)
      for (let i = 0; i < overflow && currentPlayer.floorLine.runes.length < currentPlayer.floorLine.maxCapacity; i++) {
        currentPlayer.floorLine.runes.push({ id: `floor-${Date.now()}-${i}`, runeType: move.runeType, effect: { type: 'None' } });
      }
    }
  } else {
    // All to floor line
    for (let i = 0; i < runesToPlace.length && currentPlayer.floorLine.runes.length < currentPlayer.floorLine.maxCapacity; i++) {
      currentPlayer.floorLine.runes.push({ id: `floor-${Date.now()}-${i}`, runeType: move.runeType, effect: { type: 'None' } });
    }
  }
  
  return newState;
}

/**
 * ADVANCED: Calculate expected score gain from a move by simulating end-of-round scoring
 * This simulates what would happen if the round ended after this move
 */
function simulateScoreGain(state: GameState, move: DraftMove, targetLineIndex: number | null): number {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const currentScore = calculateWallPower(currentPlayer.wall, currentPlayer.floorLine.runes.length);
  
  // Simulate the move
  const simulatedState = simulateDraftMove(state, move, targetLineIndex);
  const simulatedPlayer = simulatedState.players[simulatedState.currentPlayerIndex];
  
  // Calculate potential wall state after this line completes
  const simulatedWall = simulatedPlayer.wall.map(row => row.map(cell => ({ ...cell })));
  
  // If we're completing a pattern line, simulate adding it to the wall
  if (targetLineIndex !== null && targetLineIndex >= 0) {
    const line = simulatedPlayer.patternLines[targetLineIndex];
    if (line.count === line.tier && line.runeType !== null) {
      const col = getWallColumnForRune(targetLineIndex, line.runeType);
      simulatedWall[targetLineIndex][col].runeType = line.runeType;
    }
  }
  
  const simulatedScore = calculateWallPower(simulatedWall, simulatedPlayer.floorLine.runes.length);
  return simulatedScore - currentScore;
}

/**
 * ADVANCED: Minimax evaluation - consider opponent's best response
 * Looks ahead one move for the opponent and evaluates the resulting position
 */
function evaluateWithOpponentResponse(state: GameState, move: DraftMove, targetLineIndex: number | null): number {
  const simulatedState = simulateDraftMove(state, move, targetLineIndex);
  
  // Switch to opponent's perspective
  const opponentIndex = (1 - simulatedState.currentPlayerIndex) as 0 | 1;
  simulatedState.currentPlayerIndex = opponentIndex;
  
  // Get opponent's possible moves
  const opponentMoves = getLegalDraftMoves(simulatedState);
  if (opponentMoves.length === 0) {
    return 0; // No opponent moves available
  }
  
  // Find opponent's best move (their highest scoring move hurts us)
  let worstCaseForUs = Infinity;
  
  for (const opponentMove of opponentMoves.slice(0, Math.min(5, opponentMoves.length))) {
    // For each opponent move, find their best placement
    const opponentPlayer = simulatedState.players[simulatedState.currentPlayerIndex];
    let bestOpponentScore = -Infinity;
    
    for (let lineIdx = 0; lineIdx < 5; lineIdx++) {
      const line = opponentPlayer.patternLines[lineIdx];
      if (canPlaceOnLine(line, opponentMove.runeType, opponentPlayer.wall, lineIdx)) {
        const opponentGain = simulateScoreGain(simulatedState, opponentMove, lineIdx);
        if (opponentGain > bestOpponentScore) {
          bestOpponentScore = opponentGain;
        }
      }
    }
    
    // Calculate net position: our gain minus opponent's gain
    const ourGain = simulateScoreGain(state, move, targetLineIndex);
    const netAdvantage = ourGain - bestOpponentScore;
    
    worstCaseForUs = Math.min(worstCaseForUs, netAdvantage);
  }
  
  return worstCaseForUs === Infinity ? 0 : worstCaseForUs;
}

/**
 * Score a draft move based on:
 * 1. Completing pattern lines (highest priority)
 * 2. Avoiding wasted runes (minimize overflow to floor) - ENHANCED
 * 3. Blocking opponent's almost-complete lines
 * 4. Maximizing wall connection potential
 * 5. MEDIUM: Look-ahead planning for future moves
 * 6. MEDIUM: Value higher tier lines more aggressively
 * 7. MEDIUM: Penalize excessive waste
 * 8. ADVANCED: Scoring simulation (calculate expected point gain)
 * 9. ADVANCED: Minimax consideration (opponent response evaluation)
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
        
        // MEDIUM: Tier 5 lines worth significantly more (exponential scaling)
        const tierBonus = Math.pow(line.tier, 1.5) * 8;
        const lineValue = 100 + tierBonus + (connectionBonus * 20);
        
        if (lineValue > bestLineValue) {
          bestLineValue = lineValue;
        }
      } else {
        // Filling towards completion
        // MEDIUM: Higher tiers are more valuable even when not completing
        const tierBonus = line.tier * 8;
        const progressBonus = (move.count / spacesNeeded) * 30;
        const lineValue = 50 + tierBonus + progressBonus;
        
        if (lineValue > bestLineValue) {
          bestLineValue = lineValue;
        }
      }
      
      minWaste = Math.min(minWaste, waste);
    }
  });
  
  score += bestLineValue;
  
  // Strategy 2: MEDIUM - Enhanced waste penalty (exponential for large waste)
  if (minWaste > 0) {
    // Small waste (1-2 runes) is tolerable, large waste is very bad
    const wastePenalty = minWaste <= 2 ? minWaste * 10 : minWaste * 20 + Math.pow(minWaste - 2, 2) * 10;
    score -= wastePenalty;
  }
  
  // Strategy 3: Block opponent's progress
  opponent.patternLines.forEach((line) => {
    if (line.runeType === move.runeType && line.count > 0) {
      const spacesNeeded = line.tier - line.count;
      // If opponent is close to completing this line, blocking is valuable
      if (spacesNeeded <= 2) {
        score += 30; // Bonus for blocking opponent
      } else if (spacesNeeded <= 3) {
        score += 15; // Smaller bonus for moderately close lines
      }
    }
  });
  
  // Strategy 5: MEDIUM - Look-ahead planning
  const futureAvailability = calculateFutureAvailability(state, move);
  const ourNeeds = evaluatePatternLineNeeds(currentPlayer);
  
  // Check if we have incomplete lines that need other rune types
  ourNeeds.forEach((need, neededRuneType) => {
    if (neededRuneType !== move.runeType) {
      const futureAmount = futureAvailability.get(neededRuneType) || 0;
      // If we need this type but it's becoming scarce, slight penalty for taking other types
      if (need > futureAmount) {
        score -= 5 * (need - futureAmount);
      }
    }
  });
  
  // If this move fulfills a need we have, bonus
  const thisTypeNeed = ourNeeds.get(move.runeType) || 0;
  if (thisTypeNeed > 0) {
    score += thisTypeNeed * 8;
  }
  
  // Strategy 7: MEDIUM - Waste efficiency bonus
  const wasteEfficiency = calculateWasteEfficiency(move, currentPlayer, move.runeType);
  score += wasteEfficiency * 0.5; // Scale it down since it's already factored in waste penalty
  
  // Strategy 8: ADVANCED - Scoring simulation
  // Find the best placement line for this move
  let bestPlacementLineIndex: number | null = null;
  let bestPlacementScore = -Infinity;
  
  currentPlayer.patternLines.forEach((line, lineIndex) => {
    if (canPlaceOnLine(line, move.runeType, currentPlayer.wall, lineIndex)) {
      const placementScore = scorePlacementMove(lineIndex, state);
      if (placementScore > bestPlacementScore) {
        bestPlacementScore = placementScore;
        bestPlacementLineIndex = lineIndex;
      }
    }
  });
  
  // Calculate expected score gain through simulation
  if (bestPlacementLineIndex !== null) {
    const expectedScoreGain = simulateScoreGain(state, move, bestPlacementLineIndex);
    // Weight the simulated score heavily - it's based on actual game mechanics
    score += expectedScoreGain * 3;
  }
  
  // Strategy 9: ADVANCED - Minimax evaluation (opponent response)
  // Consider what the opponent could do in response to this move
  if (bestPlacementLineIndex !== null) {
    const minimaxScore = evaluateWithOpponentResponse(state, move, bestPlacementLineIndex);
    // Add minimax consideration (moderate weight since it's one level deep)
    score += minimaxScore * 2;
  }
  
  return score;
}

/**
 * Choose best draft move using smart strategies
 * MEDIUM: More intelligent selection with smaller randomness window
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
  
  // MEDIUM: Smarter randomness - only pick from top 2 moves, 
  // and favor the best move 85% of the time
  if (scoredMoves.length > 1 && Math.random() < 0.15) {
    return scoredMoves[1].move;
  }
  
  return scoredMoves[0].move;
}

/**
 * Score a placement move based on:
 * 1. Avoid floor line (highest priority)
 * 2. Prefer lines that will complete
 * 3. MEDIUM: Prefer higher tiers (exponential scaling)
 * 4. Maximize wall connections
 * 5. MEDIUM: Minimize waste aggressively
 */
function scorePlacementMove(
  lineIndex: number | null, 
  state: GameState
): number {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const runeCount = state.selectedRunes.length;
  
  // Floor placement (last resort)
  if (lineIndex === null) {
    // MEDIUM: Floor penalty scales with number of runes wasted
    return -100 - (runeCount * 15);
  }
  
  const line = currentPlayer.patternLines[lineIndex];
  const spacesAvailable = line.tier - line.count;
  let score = 0;
  
  // Strategy 1: MEDIUM - Enhanced waste avoidance
  if (runeCount <= spacesAvailable) {
    score += 100; // Big bonus for no waste
    // Extra bonus for perfect fit (no excess capacity)
    if (runeCount === spacesAvailable) {
      score += 25;
    }
  } else {
    const waste = runeCount - spacesAvailable;
    // MEDIUM: Exponential penalty for large waste
    const wastePenalty = waste <= 2 ? waste * 15 : waste * 25 + Math.pow(waste - 2, 2) * 10;
    score -= wastePenalty;
  }
  
  // Strategy 2: Prefer completing lines
  if (runeCount >= spacesAvailable) {
    const runeType = state.selectedRunes[0].runeType;
    const col = getWallColumnForRune(lineIndex, runeType);
    const connectionBonus = calculateConnectionScore(currentPlayer.wall, lineIndex, col);
    score += 50 + (connectionBonus * 15); // Bonus for completion + connections
  }
  
  // Strategy 3: MEDIUM - Exponentially value higher tier lines
  // Tier 5 should be significantly more valuable than tier 1
  const tierValue = Math.pow(line.tier, 1.5) * 6;
  score += tierValue;
  
  // MEDIUM: Additional bonus if this placement will complete the line
  if (runeCount >= spacesAvailable) {
    // Higher tiers give more points, so completing them is worth more
    score += line.tier * 12;
  }
  
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
 * MEDIUM: More deterministic, only randomize if scores are very close
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
  
  // MEDIUM: Only pick second best if scores are within 10 points (very close decision)
  if (scoredMoves.length > 1 && 
      Math.abs(scoredMoves[0].score - scoredMoves[1].score) <= 10 && 
      Math.random() < 0.3) {
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
