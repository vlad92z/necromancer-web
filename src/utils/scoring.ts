/**
 * Scoring utilities for Massive Spell: Arcane Arena
 * Implements connected segment scoring
 */

import type { PatternLine, ScoringWall, RuneType } from '../types/game';

/**
 * Calculate total wall power using simplified scoring
 * Essence = total number of active runes on the wall + Fire bonus
 * Focus = size of the largest connected segment (reduced by floor penalty)
 * Power = Essence × Focus
 * Runes are connected if they share an edge (not diagonal)
 * Fire Effect: Each Fire rune adds +1 to Essence
 * Life Effect: Each active Life rune heals 10 HP per round (handled in store)
 * Wind Effect: Wind runes held in incomplete pattern lines cancel floor penalties one-for-one
 */
export function calculateWallPower(
  wall: ScoringWall, 
  floorPenaltyCount: number = 0, 
  gameMode: 'classic' | 'standard' = 'standard'
): number {
  const visited = Array(5).fill(null).map(() => Array(5).fill(false));
  let totalRunes = 0;
  let largestSegment = 0;
  let fireRuneCount = 0;
  
  // Flood fill to find each connected segment
  function floodFill(row: number, col: number): number {
    // Out of bounds or already visited or empty cell
    if (row < 0 || row >= 5 || col < 0 || col >= 5 || 
        visited[row][col] || wall[row][col].runeType === null) {
      return 0;
    }
    
    visited[row][col] = true;
    let count = 1;
    
    // Check all 4 adjacent cells (up, down, left, right)
    count += floodFill(row - 1, col); // up
    count += floodFill(row + 1, col); // down
    count += floodFill(row, col - 1); // left
    count += floodFill(row, col + 1); // right
    
    return count;
  }
  
  // Find all segments and track the largest, count Fire runes
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (!visited[row][col] && wall[row][col].runeType !== null) {
        const segmentSize = floodFill(row, col);
        totalRunes += segmentSize;
        largestSegment = Math.max(largestSegment, segmentSize);
      }
      // Count Fire runes separately for bonus (only in standard mode)
      if (gameMode === 'standard' && wall[row][col].runeType === 'Fire') {
        fireRuneCount++;
      }
    }
  }
  
  // Calculate essence with Fire bonus (only in standard mode)
  const essence = totalRunes + (gameMode === 'standard' ? fireRuneCount : 0);
  
  // Apply floor penalty to focus (minimum 1)
  const focus = Math.max(1, largestSegment - floorPenaltyCount);
  const totalPower = essence * focus;
  
  return totalPower;
}

/**
 * Calculate wall power and return detailed information
 * Used for game log display
 * Returns essence (total runes + Fire bonus) and focus (largest segment)
 * Fire Effect: Each Fire rune adds +1 to Essence (only in standard mode)
 * Life Effect: Each active Life rune heals 10 HP per round (handled in store)
 * Wind Effect: Wind runes held in incomplete pattern lines cancel floor penalties one-for-one (only in standard mode)
 */
export function calculateWallPowerWithSegments(
  wall: ScoringWall, 
  floorPenaltyCount: number = 0,
  gameMode: 'classic' | 'standard' = 'standard'
): { essence: number; focus: number; totalPower: number } {
  const visited = Array(5).fill(null).map(() => Array(5).fill(false));
  let totalRunes = 0;
  let largestSegment = 0;
  let fireRuneCount = 0;
  
  function floodFill(row: number, col: number): number {
    if (row < 0 || row >= 5 || col < 0 || col >= 5 || 
        visited[row][col] || wall[row][col].runeType === null) {
      return 0;
    }
    
    visited[row][col] = true;
    let count = 1;
    
    count += floodFill(row - 1, col);
    count += floodFill(row + 1, col);
    count += floodFill(row, col - 1);
    count += floodFill(row, col + 1);
    
    return count;
  }
  
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (!visited[row][col] && wall[row][col].runeType !== null) {
        const segmentSize = floodFill(row, col);
        totalRunes += segmentSize;
        largestSegment = Math.max(largestSegment, segmentSize);
      }
      // Count Fire runes separately for bonus (only in standard mode)
      if (gameMode === 'standard' && wall[row][col].runeType === 'Fire') {
        fireRuneCount++;
      }
    }
  }
  
  // Calculate essence with Fire bonus (only in standard mode)
  const essence = totalRunes + (gameMode === 'standard' ? fireRuneCount : 0);
  
  // Apply floor penalty to focus (minimum 1)
  const focus = Math.max(1, largestSegment - floorPenaltyCount);
  const totalPower = essence * focus;
  
  return { essence, focus, totalPower };
}

/**
 * Legacy function for placement scoring (no longer used for end-of-round scoring)
 * Kept for backwards compatibility if needed
 */
export function calculatePlacementScore(
  wall: ScoringWall,
  row: number,
  col: number
): number {
  let score = 0;
  
  // Count horizontal adjacent runes
  let horizontalCount = 1;
  
  for (let c = col - 1; c >= 0; c--) {
    if (wall[row][c].runeType !== null) {
      horizontalCount++;
    } else {
      break;
    }
  }
  
  for (let c = col + 1; c < 5; c++) {
    if (wall[row][c].runeType !== null) {
      horizontalCount++;
    } else {
      break;
    }
  }
  
  // Count vertical adjacent runes
  let verticalCount = 1;
  
  for (let r = row - 1; r >= 0; r--) {
    if (wall[r][col].runeType !== null) {
      verticalCount++;
    } else {
      break;
    }
  }
  
  for (let r = row + 1; r < 5; r++) {
    if (wall[r][col].runeType !== null) {
      verticalCount++;
    } else {
      break;
    }
  }
  
  if (horizontalCount === 1 && verticalCount === 1) {
    score = 1;
  } else {
    if (horizontalCount > 1) score += horizontalCount;
    if (verticalCount > 1) score += verticalCount;
  }
  
  return score;
}

/**
 * Calculate floor line penalties
 * Standard Azul penalties: -1, -1, -2, -2, -2, -3, -3
 */
export function calculateFloorPenalty(floorLineCount: number): number {
  const penalties = [0, -1, -2, -4, -6, -8, -11, -14];
  return penalties[Math.min(floorLineCount, 7)];
}

/**
 * Calculate effective floor penalty count after Wind mitigation
 * Wind Effect: Wind runes retained in incomplete pattern lines cancel out floor penalties (only in standard mode)
 * Wind runes still count toward their pattern line capacity but mitigate floor penalties while the line remains incomplete
 */
export function calculateEffectiveFloorPenalty(
  floorRunes: Array<{ runeType: RuneType | null }>,
  patternLines: Pick<PatternLine, 'runeType' | 'count' | 'tier'>[],
  gameMode: 'classic' | 'standard' = 'standard'
): number {
  // In classic mode, no Wind mitigation - all floor runes count as penalties
  if (gameMode === 'classic') {
    return floorRunes.length;
  }

  // Wind runes only mitigate penalties while they remain in incomplete pattern lines
  const windRunesInPatternLines = patternLines.reduce((total, line) => {
    if (line.runeType !== 'Wind') {
      return total;
    }

    // Completed lines move runes to the wall during scoring, so only incomplete lines mitigate penalties
    const isLineIncomplete = line.count < line.tier;
    if (!isLineIncomplete) {
      return total;
    }

    return total + line.count;
  }, 0);

  const effectivePenalty = floorRunes.length - windRunesInPatternLines;
  return Math.max(0, effectivePenalty);
}

/**
 * Find the correct column for a rune type in a given row
 * In Azul, the wall has a fixed pattern for rune placement
 * For simplicity, we'll use: each rune type can only go in specific columns per row
 */
export function getWallColumnForRune(row: number, runeType: RuneType): number {
  // Standard Azul pattern: each row is rotated by 1
  // Fire, Frost, Life, Void, Wind -> 0, 1, 2, 3, 4
  const runeTypeIndex: Record<RuneType, number> = {
    Fire: 0,
    Frost: 1,
    Life: 2,
    Void: 3,
    Wind: 4,
  };
  
  const baseIndex = runeTypeIndex[runeType];
  // Rotate based on row
  return (baseIndex + row) % 5;
}

/**
 * Check if a row is complete (all 5 positions filled)
 */
export function isRowComplete(wall: ScoringWall, row: number): boolean {
  return wall[row].every((cell) => cell.runeType !== null);
}

/**
 * Check if a column is complete (all 5 positions filled)
 */
export function isColumnComplete(wall: ScoringWall, col: number): boolean {
  return wall.every((row) => row[col].runeType !== null);
}

/**
 * Check if all cells of a specific rune type are placed (5 total)
 */
export function isRuneTypeComplete(wall: ScoringWall, runeType: RuneType): boolean {
  let count = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (wall[row][col].runeType === runeType) {
        count++;
      }
    }
  }
  return count === 5;
}

/**
 * Calculate bonus points at end of game
 * +2 for each complete row
 * +7 for each complete column
 * +10 for each complete rune type (all 5 placed)
 */
export function calculateEndGameBonus(wall: ScoringWall): number {
  let bonus = 0;
  
  // Complete rows
  for (let row = 0; row < 5; row++) {
    if (isRowComplete(wall, row)) {
      bonus += 2;
    }
  }
  
  // Complete columns
  for (let col = 0; col < 5; col++) {
    if (isColumnComplete(wall, col)) {
      bonus += 7;
    }
  }
  
  // Complete rune types
  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind'];
  for (const runeType of runeTypes) {
    if (isRuneTypeComplete(wall, runeType)) {
      bonus += 10;
    }
  }
  
  return bonus;
}

/**
 * Calculate projected power for the end of current turn
 * Shows what essence and focus will be after placing completed pattern lines
 * Fire Effect: Each Fire rune adds +1 to Essence
 * Life Effect: Each active Life rune heals 10 HP per round (handled in store)
 * Wind Effect: Wind runes held in incomplete pattern lines cancel floor penalties one-for-one
 */
export function calculateProjectedPower(
  wall: ScoringWall,
  completedPatternLines: Array<{ row: number; runeType: RuneType }>,
  floorPenaltyCount: number,
  gameMode: 'classic' | 'standard' = 'standard'
): { essence: number; focus: number; totalPower: number } {
  // Create a simulated wall with pattern line runes placed
  const simulatedWall: ScoringWall = wall.map(row => row.map(cell => ({ ...cell })));
  
  // Place runes from completed pattern lines
  for (const { row, runeType } of completedPatternLines) {
    const col = getWallColumnForRune(row, runeType);
    simulatedWall[row][col] = { runeType };
  }
  
  // Calculate essence and focus for simulated wall
  const visited = Array(5).fill(null).map(() => Array(5).fill(false));
  let totalRunes = 0;
  let largestSegment = 0;
  let fireRuneCount = 0;
  
  function floodFill(row: number, col: number): number {
    if (row < 0 || row >= 5 || col < 0 || col >= 5 || 
        visited[row][col] || simulatedWall[row][col].runeType === null) {
      return 0;
    }
    
    visited[row][col] = true;
    let count = 1;
    
    count += floodFill(row - 1, col);
    count += floodFill(row + 1, col);
    count += floodFill(row, col - 1);
    count += floodFill(row, col + 1);
    
    return count;
  }
  
  // Find all segments and track largest, count Fire runes
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (!visited[row][col] && simulatedWall[row][col].runeType !== null) {
        const segmentSize = floodFill(row, col);
        totalRunes += segmentSize;
        largestSegment = Math.max(largestSegment, segmentSize);
      }
      // Count Fire runes separately for bonus (only in standard mode)
      if (gameMode === 'standard' && simulatedWall[row][col].runeType === 'Fire') {
        fireRuneCount++;
      }
    }
  }
  
  // Calculate essence with Fire bonus (only in standard mode)
  const essence = totalRunes + (gameMode === 'standard' ? fireRuneCount : 0);
  
  // Apply floor penalty to focus (minimum 1)
  const focus = Math.max(1, largestSegment - floorPenaltyCount);
  const totalPower = essence * focus;
  
  return { essence, focus, totalPower };
}
