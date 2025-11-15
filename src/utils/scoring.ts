/**
 * Scoring utilities for Runesmith
 * Implements connected segment scoring
 */

import type { ScoringWall, RuneType } from '../types/game';

/**
 * Calculate total wall power based on connected segments
 * Each segment's power is (number of runes in segment)^2
 * Runes are connected if they share an edge (not diagonal)
 */
export function calculateWallPower(wall: ScoringWall): number {
  const visited = Array(5).fill(null).map(() => Array(5).fill(false));
  let totalPower = 0;
  
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
  
  // Find all segments
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (!visited[row][col] && wall[row][col].runeType !== null) {
        const segmentSize = floodFill(row, col);
        const segmentPower = segmentSize * segmentSize;
        totalPower += segmentPower;
      }
    }
  }
  
  return totalPower;
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
 * Find the correct column for a rune type in a given row
 * In Azul, the wall has a fixed pattern for rune placement
 * For simplicity, we'll use: each rune type can only go in specific columns per row
 */
export function getWallColumnForRune(row: number, runeType: RuneType): number {
  // Standard Azul pattern: each row is rotated by 1
  // Fire, Frost, Poison, Void, Wind -> 0, 1, 2, 3, 4
  const runeTypeIndex: Record<RuneType, number> = {
    Fire: 0,
    Frost: 1,
    Poison: 2,
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
  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Poison', 'Void', 'Wind'];
  for (const runeType of runeTypes) {
    if (isRuneTypeComplete(wall, runeType)) {
      bonus += 10;
    }
  }
  
  return bonus;
}
