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

import type { GameState, RuneType, PatternLine, Player, Rune, ScoringWall, VoidTarget, AIDifficulty } from '../types/game';
import { getWallColumnForRune, calculateWallPower, calculateEffectiveFloorPenalty } from './scoring';

const RUNE_PRIORITIES: RuneType[] = ['Fire', 'Wind', 'Life', 'Void', 'Frost'];

const runePriorityMap: Record<RuneType, number> = {
  Fire: 0,
  Wind: 1,
  Life: 2,
  Void: 3,
  Frost: 4,
};

interface DraftMove {
  type: 'runeforge' | 'center';
  runeforgeId?: string;
  runeType: RuneType;
  count: number; // Number of runes that will be drafted
}

/**
 * Count runes of a specific type in a location
 */
function countRunes(runes: Rune[], runeType: RuneType): number {
  return runes.filter(r => r.runeType === runeType).length;
}

/**
 * Get all legal draft moves for the current AI player with rune counts
 */
function getLegalDraftMoves(state: GameState): DraftMove[] {
  const moves: DraftMove[] = [];
  const currentPlayer = state.players[state.currentPlayerIndex];
  const currentPlayerRuneforges = state.runeforges.filter(runeforge => runeforge.ownerId === currentPlayer.id);
  const hasAccessibleRuneforges = currentPlayerRuneforges.some(
    runeforge => runeforge.runes.length > 0
  );
  const centerIsEmpty = state.centerPool.length === 0;
  const canUseOpponentRuneforges = !hasAccessibleRuneforges && centerIsEmpty;
  
  // Get unique rune types from runeforges with counts
  state.runeforges.forEach(runeforge => {
    if (runeforge.runes.length > 0) {
      const ownsRuneforge = runeforge.ownerId === currentPlayer.id;
      if (!ownsRuneforge && !canUseOpponentRuneforges) {
        return;
      }

      const runeTypes = new Set(runeforge.runes.map(r => r.runeType));
      runeTypes.forEach((runeType: RuneType) => {
        moves.push({ 
          type: 'runeforge', 
          runeforgeId: runeforge.id, 
          runeType,
          count: countRunes(runeforge.runes, runeType)
        });
      });
    }
  });
  
  // Get unique rune types from center with counts
  if (state.centerPool.length > 0 && !hasAccessibleRuneforges) {
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
 * Get legal draft moves for any player index (used by easy AI and opponent lookahead)
 */
function getLegalDraftMovesForPlayer(state: GameState, playerIndex: 0 | 1): DraftMove[] {
  const moves: DraftMove[] = [];
  const targetPlayer = state.players[playerIndex];
  const playerRuneforges = state.runeforges.filter((runeforge) => runeforge.ownerId === targetPlayer.id);
  const hasAccessibleRuneforges = playerRuneforges.some((runeforge) => runeforge.runes.length > 0);
  const centerIsEmpty = state.centerPool.length === 0;
  const canUseOpponentRuneforges = !hasAccessibleRuneforges && centerIsEmpty;

  state.runeforges.forEach((runeforge) => {
    if (runeforge.runes.length === 0) {
      return;
    }
    const ownsRuneforge = runeforge.ownerId === targetPlayer.id;
    if (!ownsRuneforge && !canUseOpponentRuneforges) {
      return;
    }

    const runeTypes = new Set(runeforge.runes.map((r) => r.runeType));
    runeTypes.forEach((runeType: RuneType) => {
      moves.push({
        type: 'runeforge',
        runeforgeId: runeforge.id,
        runeType,
        count: countRunes(runeforge.runes, runeType),
      });
    });
  });

  if (state.centerPool.length > 0 && !hasAccessibleRuneforges) {
    const runeTypes = new Set(state.centerPool.map((rune) => rune.runeType));
    runeTypes.forEach((runeType) => {
      moves.push({
        type: 'center',
        runeType,
        count: countRunes(state.centerPool, runeType),
      });
    });
  }

  return moves;
}

/**
 * Check if a pattern line can accept a specific rune type
 */
function canPlaceOnLine(
  line: PatternLine,
  runeType: RuneType,
  wall: ScoringWall,
  lineIndex: number,
  frozenLineIndexes: number[] = []
): boolean {
  if (frozenLineIndexes.includes(lineIndex)) {
    return false;
  }
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
function calculateConnectionScore(wall: ScoringWall, row: number, col: number): number {
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
  state.runeforges.forEach(runeforge => {
    runeforge.runes.forEach((rune: Rune) => {
      availability.set(rune.runeType, (availability.get(rune.runeType) || 0) + 1);
    });
  });
  
  state.centerPool.forEach((rune: Rune) => {
    availability.set(rune.runeType, (availability.get(rune.runeType) || 0) + 1);
  });
  
  // Subtract the runes we're drafting
  availability.set(move.runeType, (availability.get(move.runeType) || 0) - move.count);
  
  // If drafting from runeforge, other runes will move to center (still available for opponent)
  // This doesn't change total availability, just location
  
  return availability;
}

/**
 * MEDIUM COMPLEXITY: Evaluate pattern lines that need this rune type
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
  player: { patternLines: PatternLine[], wall: ScoringWall }, 
  runeType: RuneType,
  frozenLineIndexes: number[] = []
): number {
  let bestEfficiency = -100; // Default: all runes wasted
  
  player.patternLines.forEach((line, lineIndex) => {
    if (canPlaceOnLine(line, runeType, player.wall, lineIndex, frozenLineIndexes)) {
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
    runeforges: state.runeforges.map(f => ({ ...f, runes: [...f.runes] })),
    centerPool: [...state.centerPool],
    selectedRunes: []
  };
  
  const currentPlayer = newState.players[newState.currentPlayerIndex];
  let runesToPlace: { runeType: RuneType }[] = [];
  
  // Execute draft
  if (move.type === 'runeforge' && move.runeforgeId) {
    const runeforge = newState.runeforges.find(f => f.id === move.runeforgeId);
    if (runeforge) {
      runesToPlace = runeforge.runes.filter(r => r.runeType === move.runeType);
      const remainingRunes = runeforge.runes.filter(r => r.runeType !== move.runeType);
      newState.centerPool.push(...remainingRunes);
      runeforge.runes = [];
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
  const currentPenalty = calculateEffectiveFloorPenalty(
    currentPlayer.floorLine.runes,
    currentPlayer.patternLines,
    currentPlayer.wall,
    state.gameMode
  );
  const currentScore = calculateWallPower(currentPlayer.wall, currentPenalty, state.gameMode);
  
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
  
  const simulatedPenalty = calculateEffectiveFloorPenalty(
    simulatedPlayer.floorLine.runes,
    simulatedPlayer.patternLines,
    simulatedWall,
    state.gameMode
  );
  const simulatedScore = calculateWallPower(simulatedWall, simulatedPenalty, state.gameMode);
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
    const opponentFrozenLines = simulatedState.frozenPatternLines[opponentPlayer.id] ?? [];
    let bestOpponentScore = -Infinity;
    
    for (let lineIdx = 0; lineIdx < 5; lineIdx++) {
      const line = opponentPlayer.patternLines[lineIdx];
      if (canPlaceOnLine(line, opponentMove.runeType, opponentPlayer.wall, lineIdx, opponentFrozenLines)) {
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
  const currentPlayerFrozenLines = state.frozenPatternLines[currentPlayer.id] ?? [];
  let score = 0;
  
  // Find best line this move could fill
  let bestLineValue = 0;
  let minWaste = move.count;
  
  currentPlayer.patternLines.forEach((line, lineIndex) => {
    if (canPlaceOnLine(line, move.runeType, currentPlayer.wall, lineIndex, currentPlayerFrozenLines)) {
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
  const wasteEfficiency = calculateWasteEfficiency(move, currentPlayer, move.runeType, currentPlayerFrozenLines);
  score += wasteEfficiency * 0.5; // Scale it down since it's already factored in waste penalty
  
  // Strategy 8: ADVANCED - Scoring simulation
  // Find the best placement line for this move
  let bestPlacementLineIndex: number | null = null;
  let bestPlacementScore = -Infinity;
  
  currentPlayer.patternLines.forEach((line, lineIndex) => {
    if (canPlaceOnLine(line, move.runeType, currentPlayer.wall, lineIndex, currentPlayerFrozenLines)) {
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
  const frozenLines = state.frozenPatternLines[currentPlayer.id] ?? [];
  const runeCount = state.selectedRunes.length;
  
  // Floor placement (last resort)
  if (lineIndex === null) {
    // MEDIUM: Floor penalty scales with number of runes wasted
    return -100 - (runeCount * 15);
  }
  
  if (frozenLines.includes(lineIndex)) {
    return -Infinity;
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
  const frozenLines = state.frozenPatternLines[currentPlayer.id] ?? [];
  
  if (state.selectedRunes.length === 0) return moves;
  
  const runeType = state.selectedRunes[0].runeType;
  
  // Check each pattern line
  currentPlayer.patternLines.forEach((line, index) => {
    if (canPlaceOnLine(line, runeType, currentPlayer.wall, index, frozenLines)) {
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
 * Estimate how valuable a rune type is for the opponent.
 */
function calculateOpponentNeedForRune(opponent: Player, runeType: RuneType): number {
  let bestScore = 0;

  opponent.patternLines.forEach((line, lineIndex) => {
    // Skip lines that cannot take this rune type
    if (line.runeType !== null && line.runeType !== runeType) {
      return;
    }

    if (line.count >= line.tier) {
      return;
    }

    const col = getWallColumnForRune(lineIndex, runeType);
    if (opponent.wall[lineIndex][col].runeType !== null) {
      return;
    }

    const spacesRemaining = line.tier - line.count;
    let score = 6 + line.tier * 2;

    // Prefer lines that are close to completion
    if (spacesRemaining === 1) {
      score += 14;
    } else {
      score += Math.max(0, 4 - spacesRemaining) * 2;
    }

    // Slight bonus for starting empty lines of higher tiers
    if (line.count === 0) {
      score += 4 + line.tier;
    } else {
      score += line.count * 3;
    }

    if (score > bestScore) {
      bestScore = score;
    }
  });

  return bestScore;
}

/**
 * Choose which rune to destroy with the Void effect.
 * Strategy: Remove the rune that most helps the opponent progress.
 */
export function chooseVoidRuneTarget(state: GameState): VoidTarget | null {
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];
  const currentPlayerId = state.players[state.currentPlayerIndex].id;

  const candidates: Array<{ target: VoidTarget; score: number }> = [];

  state.runeforges.forEach((runeforge) => {
    runeforge.runes.forEach((rune) => {
      const needScore = Math.max(2, calculateOpponentNeedForRune(opponent, rune.runeType));
      let totalScore = needScore;

      if (runeforge.ownerId === opponent.id) {
        totalScore += 6;
      } else if (runeforge.ownerId === currentPlayerId) {
        totalScore -= 4;
      } else {
        totalScore += 2;
      }

      candidates.push({
        target: { source: 'runeforge', runeforgeId: runeforge.id, runeId: rune.id },
        score: totalScore,
      });
    });
  });

  state.centerPool.forEach((rune) => {
    const needScore = Math.max(2, calculateOpponentNeedForRune(opponent, rune.runeType));
    candidates.push({
      target: { source: 'center', runeId: rune.id },
      score: needScore + 4,
    });
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].target;
}

/**
 * AI chooses which opponent pattern line to freeze with Frost effect
 * Strategy: Freeze lines that are close to completion or high-value tiers
 */
export function choosePatternLineToFreeze(state: GameState): number | null {
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];
  const frozenLines = state.frozenPatternLines[opponent.id] ?? [];
  
  let bestLineIndex: number | null = null;
  let bestScore = -Infinity;
  
  opponent.patternLines.forEach((line, index) => {
    if (line.count >= line.tier) {
      return;
    }
    if (frozenLines.includes(index)) {
      return;
    }
    
    const spacesRemaining = line.tier - line.count;
    const row = index;
    const runeType = line.runeType;
    const columnOccupied = runeType ? opponent.wall[row][getWallColumnForRune(row, runeType)].runeType !== null : false;
    if (columnOccupied) {
      return;
    }
    
    let score = 0;
    
    // Progress on the line matters the most
    score += line.count * 12;
    
    // High tier lines are more valuable to block
    score += line.tier * 4;
    
    // Nearly complete lines get a large bonus
    if (line.count === line.tier - 1 && line.count > 0) {
      score += 25;
    }
    
    // Lines with established rune type are more disruptive to freeze
    if (line.runeType !== null) {
      score += 10;
    }
    
    // Prefer lines that still have room but aren't empty
    score -= spacesRemaining * 2;
    
    if (score > bestScore) {
      bestScore = score;
      bestLineIndex = index;
    }
  });
  
  return bestLineIndex;
}

interface EasyDraftOption {
  move: DraftMove;
  targetLineIndex: number;
  spaces: number;
  hasExistingRunes: boolean;
  runeType: RuneType;
}

interface EasyPlacementOption {
  targetLineIndex: number;
  spaces: number;
  hasExistingRunes: boolean;
  runeType: RuneType;
  overflow: number;
}

const compareLinePreference = (a: EasyDraftOption | EasyPlacementOption, b: EasyDraftOption | EasyPlacementOption): number => {
  if (a.spaces !== b.spaces) {
    return b.spaces - a.spaces; // Larger lines first
  }
  if (a.hasExistingRunes !== b.hasExistingRunes) {
    return a.hasExistingRunes ? -1 : 1; // Prefer lines with existing runes
  }
  const priorityDiff = runePriorityMap[a.runeType] - runePriorityMap[b.runeType];
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  return a.targetLineIndex - b.targetLineIndex; // Stable tie-breaker
};

function findBestPerfectDraftOption(state: GameState): EasyDraftOption | null {
  const moves = getLegalDraftMoves(state);
  const currentPlayer = state.players[state.currentPlayerIndex];
  const frozenLines = state.frozenPatternLines[currentPlayer.id] ?? [];
  const options: EasyDraftOption[] = [];

  moves.forEach((move) => {
    currentPlayer.patternLines.forEach((line, lineIndex) => {
      if (frozenLines.includes(lineIndex)) {
        return;
      }
      const spaces = line.tier - line.count;
      if (spaces !== move.count) {
        return;
      }
      if (!canPlaceOnLine(line, move.runeType, currentPlayer.wall, lineIndex, frozenLines)) {
        return;
      }
      options.push({
        move,
        targetLineIndex: lineIndex,
        spaces,
        hasExistingRunes: line.count > 0,
        runeType: move.runeType,
      });
    });
  });

  if (options.length === 0) {
    return null;
  }

  options.sort(compareLinePreference);
  return options[0];
}

function chooseEasyPlacementMove(state: GameState): { type: 'line' | 'floor'; lineIndex?: number } | null {
  if (state.selectedRunes.length === 0) {
    return null;
  }
  const currentPlayer = state.players[state.currentPlayerIndex];
  const frozenLines = state.frozenPatternLines[currentPlayer.id] ?? [];
  const runeType = state.selectedRunes[0].runeType;
  const runeCount = state.selectedRunes.length;

  const perfectOptions: EasyPlacementOption[] = [];
  const fallbackOptions: EasyPlacementOption[] = [];

  currentPlayer.patternLines.forEach((line, lineIndex) => {
    if (frozenLines.includes(lineIndex)) {
      return;
    }
    if (!canPlaceOnLine(line, runeType, currentPlayer.wall, lineIndex, frozenLines)) {
      return;
    }
    const spaces = line.tier - line.count;
    const option: EasyPlacementOption = {
      targetLineIndex: lineIndex,
      spaces,
      hasExistingRunes: line.count > 0,
      runeType,
      overflow: Math.max(0, runeCount - spaces),
    };

    if (spaces === runeCount) {
      perfectOptions.push(option);
    } else {
      fallbackOptions.push(option);
    }
  });

  if (perfectOptions.length > 0) {
    perfectOptions.sort(compareLinePreference);
    return { type: 'line', lineIndex: perfectOptions[0].targetLineIndex };
  }

  if (fallbackOptions.length > 0) {
    fallbackOptions.sort((a, b) => {
      if (a.overflow !== b.overflow) {
        return a.overflow - b.overflow; // Minimal waste
      }
      return compareLinePreference(a, b);
    });
    return { type: 'line', lineIndex: fallbackOptions[0].targetLineIndex };
  }

  return { type: 'floor' };
}

interface FinishableLine {
  lineIndex: number;
  runeType: RuneType;
  spaces: number;
  hasExistingRunes: boolean;
  tier: number;
  bestMove: DraftMove;
  surplus: number;
}

function getFinishableLinesForPlayer(state: GameState, playerIndex: 0 | 1): FinishableLine[] {
  const targetPlayer = state.players[playerIndex];
  const frozenLines = state.frozenPatternLines[targetPlayer.id] ?? [];
  const legalMoves = getLegalDraftMovesForPlayer(state, playerIndex);
  const finishable: FinishableLine[] = [];

  targetPlayer.patternLines.forEach((line, lineIndex) => {
    if (frozenLines.includes(lineIndex)) {
      return;
    }
    const spaces = line.tier - line.count;
    if (spaces <= 0) {
      return;
    }

    const candidateRuneTypes: RuneType[] = line.runeType ? [line.runeType] : RUNE_PRIORITIES;

    candidateRuneTypes.forEach((runeType) => {
      if (!canPlaceOnLine(line, runeType, targetPlayer.wall, lineIndex, frozenLines)) {
        return;
      }
      const matchingMoves = legalMoves
        .filter((move) => move.runeType === runeType && move.count >= spaces)
        .sort((a, b) => a.count - b.count);

      if (matchingMoves.length === 0) {
        return;
      }

      const bestMove = matchingMoves[0];
      finishable.push({
        lineIndex,
        runeType,
        spaces,
        hasExistingRunes: line.count > 0,
        tier: line.tier,
        bestMove,
        surplus: bestMove.count - spaces,
      });
    });
  });

  return finishable;
}

function chooseEasyVoidRuneTarget(state: GameState): VoidTarget | null {
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const finishableLines = getFinishableLinesForPlayer(state, opponentIndex).filter((entry) => entry.surplus === 0);

  if (finishableLines.length === 0) {
    return null;
  }

  finishableLines.sort((a, b) => {
    if (a.spaces !== b.spaces) {
      return b.spaces - a.spaces;
    }
    if (a.hasExistingRunes !== b.hasExistingRunes) {
      return a.hasExistingRunes ? -1 : 1;
    }
    const priorityDiff = runePriorityMap[a.runeType] - runePriorityMap[b.runeType];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return a.lineIndex - b.lineIndex;
  });

  const targetLine = finishableLines[0];
  const { bestMove } = targetLine;

  if (bestMove.type === 'runeforge' && bestMove.runeforgeId) {
    const runeforge = state.runeforges.find((forge) => forge.id === bestMove.runeforgeId);
    const rune = runeforge?.runes.find((r) => r.runeType === targetLine.runeType);
    if (runeforge && rune) {
      return { source: 'runeforge', runeforgeId: runeforge.id, runeId: rune.id };
    }
  }

  if (bestMove.type === 'center') {
    const rune = state.centerPool.find((r) => r.runeType === targetLine.runeType);
    if (rune) {
      return { source: 'center', runeId: rune.id };
    }
  }

  return null;
}

function chooseEasyPatternLineToFreeze(state: GameState): number | null {
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const finishableLines = getFinishableLinesForPlayer(state, opponentIndex);

  if (finishableLines.length === 0) {
    return null;
  }

  finishableLines.sort((a, b) => {
    if (a.tier !== b.tier) {
      return b.tier - a.tier; // Biggest pattern line first
    }
    if (a.hasExistingRunes !== b.hasExistingRunes) {
      return a.hasExistingRunes ? -1 : 1;
    }
    const priorityDiff = runePriorityMap[a.runeType] - runePriorityMap[b.runeType];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return a.lineIndex - b.lineIndex;
  });

  return finishableLines[0].lineIndex;
}

function makeEasyAIMove(
  state: GameState,
  draftRune: (runeforgeId: string, runeType: RuneType) => void,
  draftFromCenter: (runeType: RuneType) => void,
  placeRunes: (lineIndex: number) => void,
  placeRunesInFloor: () => void
): boolean {
  if (state.selectedRunes.length > 0) {
    const placement = chooseEasyPlacementMove(state);
    if (!placement) {
      return false;
    }
    if (placement.type === 'floor') {
      placeRunesInFloor();
    } else if (placement.lineIndex !== undefined) {
      placeRunes(placement.lineIndex);
    }
    return true;
  }

  const perfectOption = findBestPerfectDraftOption(state);
  const move = perfectOption?.move ?? chooseBestDraftMove(state);
  if (!move) {
    return false;
  }

  if (move.type === 'runeforge' && move.runeforgeId) {
    draftRune(move.runeforgeId, move.runeType);
  } else if (move.type === 'center') {
    draftFromCenter(move.runeType);
  }

  return true;
}

interface CombinedDraftMove {
  move: DraftMove;
  targetLineIndex: number | null;
}

const HARD_SEARCH_DEPTH = 3;
const MAX_PLACEMENTS_PER_MOVE = 3;

function evaluateBoardState(state: GameState, aiIndex: 0 | 1): number {
  const aiPlayer = state.players[aiIndex];
  const opponentIndex = (1 - aiIndex) as 0 | 1;
  const opponent = state.players[opponentIndex];

  const aiPenalty = calculateEffectiveFloorPenalty(
    aiPlayer.floorLine.runes,
    aiPlayer.patternLines,
    aiPlayer.wall,
    state.gameMode
  );
  const opponentPenalty = calculateEffectiveFloorPenalty(
    opponent.floorLine.runes,
    opponent.patternLines,
    opponent.wall,
    state.gameMode
  );

  const aiPower = calculateWallPower(aiPlayer.wall, aiPenalty, state.gameMode);
  const opponentPower = calculateWallPower(opponent.wall, opponentPenalty, state.gameMode);

  const aiFinishables = getFinishableLinesForPlayer(state, aiIndex);
  const opponentFinishables = getFinishableLinesForPlayer(state, opponentIndex);

  const finishableValue = (entry: FinishableLine): number => {
    const base = entry.tier * 10;
    const progress = entry.hasExistingRunes ? 12 : 4;
    const perfect = entry.surplus === 0 ? 18 : 0;
    const typeBias = Math.max(0, 6 - runePriorityMap[entry.runeType]);
    return base + progress + perfect + typeBias;
  };

  const aiOpportunity =
    aiFinishables.length === 0
      ? 0
      : Math.max(...aiFinishables.map(finishableValue));

  const opponentThreat =
    opponentFinishables.length === 0
      ? 0
      : Math.max(...opponentFinishables.map(finishableValue));

  // Reward self power, subtract opponent power and their best finishing threat.
  return (aiPower - opponentPower) + aiOpportunity * 0.5 - opponentThreat * 0.9;
}

function getPlacementCandidatesForMove(
  state: GameState,
  playerIndex: 0 | 1,
  move: DraftMove
): CombinedDraftMove[] {
  const player = state.players[playerIndex];
  const frozenLines = state.frozenPatternLines[player.id] ?? [];
  const baseState: GameState = { ...state, currentPlayerIndex: playerIndex };

  const placements: Array<{ targetLineIndex: number | null; score: number }> = [];

  player.patternLines.forEach((line, lineIndex) => {
    if (canPlaceOnLine(line, move.runeType, player.wall, lineIndex, frozenLines)) {
      const score = simulateScoreGain(baseState, move, lineIndex);
      placements.push({ targetLineIndex: lineIndex, score });
    }
  });

  if (placements.length === 0) {
    placements.push({ targetLineIndex: null, score: -Infinity });
  }

  placements.sort((a, b) => b.score - a.score);

  return placements.slice(0, MAX_PLACEMENTS_PER_MOVE).map((placement) => ({
    move,
    targetLineIndex: placement.targetLineIndex,
  }));
}

function getHardCandidateMoves(state: GameState, playerIndex: 0 | 1): CombinedDraftMove[] {
  const moves = getLegalDraftMovesForPlayer(state, playerIndex);
  const candidates: CombinedDraftMove[] = [];

  moves.forEach((move) => {
    const placements = getPlacementCandidatesForMove(state, playerIndex, move);
    candidates.push(...placements);
  });

  return candidates;
}

function simulateCombinedMove(
  state: GameState,
  playerIndex: 0 | 1,
  combinedMove: CombinedDraftMove
): GameState {
  const baseState: GameState = {
    ...state,
    currentPlayerIndex: playerIndex,
  };

  const simulated = simulateDraftMove(baseState, combinedMove.move, combinedMove.targetLineIndex);
  simulated.currentPlayerIndex = playerIndex === 0 ? 1 : 0;
  simulated.selectedRunes = [];
  simulated.turnPhase = 'draft';
  return simulated;
}

function minimaxSearch(
  state: GameState,
  depth: number,
  aiIndex: 0 | 1,
  currentPlayerIndex: 0 | 1,
  alpha: number,
  beta: number
): { score: number; move?: CombinedDraftMove } {
  if (depth === 0) {
    return { score: evaluateBoardState(state, aiIndex) };
  }

  const moves = getHardCandidateMoves(state, currentPlayerIndex);
  if (moves.length === 0) {
    return { score: evaluateBoardState(state, aiIndex) };
  }

  const maximizingPlayer = currentPlayerIndex === aiIndex;
  let bestScore = maximizingPlayer ? -Infinity : Infinity;
  let bestMove: CombinedDraftMove | undefined;

  for (const candidate of moves) {
    const nextState = simulateCombinedMove(state, currentPlayerIndex, candidate);
    const result = minimaxSearch(
      nextState,
      depth - 1,
      aiIndex,
      nextState.currentPlayerIndex,
      alpha,
      beta
    );

    if (maximizingPlayer) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = candidate;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) {
        break;
      }
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = candidate;
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) {
        break;
      }
    }
  }

  return { score: bestScore, move: bestMove };
}

function chooseHardDraftMove(state: GameState): CombinedDraftMove | null {
  const aiIndex = state.currentPlayerIndex as 0 | 1;
  const searchResult = minimaxSearch(
    state,
    HARD_SEARCH_DEPTH,
    aiIndex,
    aiIndex,
    -Infinity,
    Infinity
  );

  if (searchResult.move) {
    return searchResult.move;
  }

  const fallbackDraft = chooseBestDraftMove(state);
  if (!fallbackDraft) {
    return null;
  }

  return {
    move: fallbackDraft,
    targetLineIndex: null,
  };
}

function makeRandomAIMove(
  state: GameState,
  draftRune: (runeforgeId: string, runeType: RuneType) => void,
  draftFromCenter: (runeType: RuneType) => void,
  placeRunes: (lineIndex: number) => void,
  placeRunesInFloor: () => void
): boolean {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const frozenLines = state.frozenPatternLines[currentPlayer.id] ?? [];

  if (state.selectedRunes.length > 0) {
    const runeType = state.selectedRunes[0].runeType;
    const availableLines = currentPlayer.patternLines
      .map((line, index) => ({ line, index }))
      .filter(({ line, index }) => {
        if (frozenLines.includes(index)) return false;
        if (line.count >= line.tier) return false;
        if (line.runeType !== null && line.runeType !== runeType) return false;
        const col = getWallColumnForRune(index, runeType);
        if (currentPlayer.wall[index][col].runeType !== null) return false;
        return true;
      });

    if (availableLines.length === 0) {
      placeRunesInFloor();
      return true;
    }

    const choice = availableLines[Math.floor(Math.random() * availableLines.length)];
    placeRunes(choice.index);
    return true;
  }

  const draftMoves = getLegalDraftMoves(state);
  if (draftMoves.length === 0) {
    return false;
  }
  const move = draftMoves[Math.floor(Math.random() * draftMoves.length)];
  if (move.type === 'runeforge' && move.runeforgeId) {
    draftRune(move.runeforgeId, move.runeType);
  } else if (move.type === 'center') {
    draftFromCenter(move.runeType);
  }

  return true;
}

function chooseRandomVoidRuneTarget(state: GameState): VoidTarget | null {
  const runeforgeTargets: VoidTarget[] = state.runeforges.flatMap((forge) =>
    forge.runes.map((rune) => ({
      source: 'runeforge' as const,
      runeforgeId: forge.id,
      runeId: rune.id,
    }))
  );
  const centerTargets: VoidTarget[] = state.centerPool.map((rune) => ({
    source: 'center' as const,
    runeId: rune.id,
  }));

  const allTargets = [...runeforgeTargets, ...centerTargets];
  if (allTargets.length === 0) {
    return null;
  }
  return allTargets[Math.floor(Math.random() * allTargets.length)];
}

function chooseRandomPatternLineToFreeze(state: GameState): number | null {
  const opponentIndex = state.currentPlayerIndex === 0 ? 1 : 0;
  const opponent = state.players[opponentIndex];
  const frozen = state.frozenPatternLines[opponent.id] ?? [];

  const candidates = opponent.patternLines
    .map((line, index) => ({ line, index }))
    .filter(({ line, index }) => !frozen.includes(index) && line.count < line.tier);

  if (candidates.length === 0) {
    return null;
  }

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  return choice.index;
}

/**
 * Make a smart move for the AI player
 * Returns true if a move was made, false if no legal moves available
 */
export function makeAIMove(
  state: GameState,
  draftRune: (runeforgeId: string, runeType: RuneType) => void,
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
  
  if (move.type === 'runeforge' && move.runeforgeId) {
    draftRune(move.runeforgeId, move.runeType);
  } else if (move.type === 'center') {
    draftFromCenter(move.runeType);
  }
  
  return true;
}

export interface AIPlayerProfile {
  id: AIDifficulty;
  makeMove: typeof makeAIMove;
  chooseVoidTarget: typeof chooseVoidRuneTarget;
  choosePatternLineToFreeze: typeof choosePatternLineToFreeze;
}

const createBaseAIProfile = (id: AIDifficulty): AIPlayerProfile => ({
  id,
  makeMove: makeAIMove,
  chooseVoidTarget: chooseVoidRuneTarget,
  choosePatternLineToFreeze,
});

export const aiPlayerProfiles: Record<AIDifficulty, AIPlayerProfile> = {
  easy: {
    id: 'easy',
    makeMove: makeEasyAIMove,
    chooseVoidTarget: chooseEasyVoidRuneTarget,
    choosePatternLineToFreeze: chooseEasyPatternLineToFreeze,
  },
  normal: createBaseAIProfile('normal'),
  hard: {
    id: 'hard',
    makeMove: makeRandomAIMove,
    chooseVoidTarget: chooseRandomVoidRuneTarget,
    choosePatternLineToFreeze: chooseRandomPatternLineToFreeze,
  },
};

export function getAIPlayerProfile(difficulty: AIDifficulty): AIPlayerProfile {
  return aiPlayerProfiles[difficulty] ?? aiPlayerProfiles.normal;
}
