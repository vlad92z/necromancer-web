/**
 * Scoring utilities for Massive Spell: Arcane Arena
 * Implements connected segment scoring
 */

import type { PatternLine, RuneEffects, RuneType, ScoringWall } from '../types/game';
import { copyRuneEffects, getPassiveEffectValue, getRuneEffectsForType } from './runeEffects';

/**
 * Calculate total wall power using simplified scoring
 * Essence = total runes on the wall + passive essence bonuses
 * Focus = size of the largest connected segment (floor penalties no longer reduce focus)
 * Power = Essence × Focus
 * Runes are connected if they share an edge (not diagonal)
 * Healing and other passives are handled elsewhere via the wall cell effects.
 */
export function calculateWallPower(
  wall: ScoringWall, 
  _floorPenaltyCount: number = 0, 
  gameMode: 'classic' | 'standard' = 'standard'
): number {
  const wallSize = wall.length;
  const visited = Array(wallSize).fill(null).map(() => Array(wallSize).fill(false));
  let totalRunes = 0;
  let largestSegment = 0;
  let essenceBonus = 0;
  
  // Flood fill to find each connected segment
  function floodFill(row: number, col: number): number {
    // Out of bounds or already visited or empty cell
    if (row < 0 || row >= wallSize || col < 0 || col >= wallSize || 
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
  for (let row = 0; row < wallSize; row++) {
    for (let col = 0; col < wallSize; col++) {
      if (!visited[row][col] && wall[row][col].runeType !== null) {
        const segmentSize = floodFill(row, col);
        totalRunes += segmentSize;
        largestSegment = Math.max(largestSegment, segmentSize);
      }
      if (gameMode === 'standard') {
        essenceBonus += getPassiveEffectValue(wall[row][col].effects, 'EssenceBonus');
      }
    }
  }
  
  // Calculate essence with Fire bonus (only in standard mode)
  const essence = totalRunes + (gameMode === 'standard' ? essenceBonus : 0);
  
  // Focus is no longer reduced by overload penalties
  const focus = Math.max(1, largestSegment);
  const totalPower = essence * focus;
  
  return totalPower;
}

/**
 * Calculate wall power and return detailed information
 * Used for game log display
 * Returns essence (total runes + passive essence bonuses) and focus (largest segment)
 * Passive bonuses come from wall cell effects; floor penalties are provided by caller.
 */
export function calculateWallPowerWithSegments(
  wall: ScoringWall, 
  _floorPenaltyCount: number = 0,
  gameMode: 'classic' | 'standard' = 'standard'
): { essence: number; focus: number; totalPower: number } {
  const wallSize = wall.length;
  const visited = Array(wallSize).fill(null).map(() => Array(wallSize).fill(false));
  let totalRunes = 0;
  let largestSegment = 0;
  let essenceBonus = 0;
  
  function floodFill(row: number, col: number): number {
    if (row < 0 || row >= wallSize || col < 0 || col >= wallSize || 
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
  
  for (let row = 0; row < wallSize; row++) {
    for (let col = 0; col < wallSize; col++) {
      if (!visited[row][col] && wall[row][col].runeType !== null) {
        const segmentSize = floodFill(row, col);
        totalRunes += segmentSize;
        largestSegment = Math.max(largestSegment, segmentSize);
      }
      if (gameMode === 'standard') {
        essenceBonus += getPassiveEffectValue(wall[row][col].effects, 'EssenceBonus');
      }
    }
  }
  
  // Calculate essence with Fire bonus (only in standard mode)
  const essence = totalRunes + (gameMode === 'standard' ? essenceBonus : 0);
  
  // Focus is no longer reduced by overload penalties
  const focus = Math.max(1, largestSegment);
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
  const wallSize = wall.length;
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
  
  for (let c = col + 1; c < wallSize; c++) {
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
  
  for (let r = row + 1; r < wallSize; r++) {
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
 */
export function calculateFloorPenalty(floorLineCount: number): number {
  const penalties = [0, -1, -2, -4, -6, -8, -11, -14];
  return penalties[Math.min(floorLineCount, 7)];
}

/**
 * Calculate effective floor penalty count after Wind mitigation.
 * Wind Effect: Only Wind runes anchored to the scoring wall cancel penalties.
 * Completed Wind pattern lines count as "pending" wall placements and mitigate immediately.
 */
export function calculateEffectiveFloorPenalty(
  floorRunes: Array<{ runeType: RuneType | null; effects?: RuneEffects | null }>,
  patternLines: Pick<PatternLine, 'runeType' | 'count' | 'tier' | 'firstRuneEffects'>[],
  wall: ScoringWall,
  gameMode: 'classic' | 'standard' = 'standard'
): number {
  // In classic mode, no Wind mitigation - all floor runes count as penalties
  if (gameMode === 'classic') {
    return floorRunes.length;
  }

  const windRunesOnWall = wall.flat().reduce((total, cell) => (
    total + getPassiveEffectValue(cell.effects, 'FloorPenaltyMitigation')
  ), 0);

  // Completed Wind pattern lines count as pending placements (if the wall slot is still empty)
  const wallSize = wall.length;
  const pendingWindPlacements = patternLines.reduce((total, line, rowIndex) => {
    if (line.count !== line.tier || line.runeType === null) {
      return total;
    }
    const effects = line.firstRuneEffects ?? getRuneEffectsForType(line.runeType);
    const mitigation = getPassiveEffectValue(effects, 'FloorPenaltyMitigation');
    if (mitigation === 0) {
      return total;
    }
    const col = getWallColumnForRune(rowIndex, line.runeType, wallSize);
    const alreadyPlaced = wall[rowIndex][col]?.runeType === line.runeType;
    return alreadyPlaced ? total : total + mitigation;
  }, 0);

  const mitigatingWindRunes = windRunesOnWall + pendingWindPlacements;
  const effectivePenalty = floorRunes.length - mitigatingWindRunes;
  return Math.max(0, effectivePenalty);
}

/**
 * Apply Frost mitigation to strain/stress (10% per mitigation point)
 */
export function applyStressMitigation(strain: number, mitigation: number): number {
  const mitigationFactor = Math.max(0, 1 - mitigation);
  const mitigatedStrain = strain * mitigationFactor;
  return Math.max(0, Math.round(mitigatedStrain * 10) / 10);
}

/**
 * Find the correct column for a rune type in a given row
 * The wall has a fixed pattern for rune placement
 * For simplicity, we'll use: each rune type can only go in specific columns per row
 * The modulo is based on the wall size (3, 4, or 5)
 */
export function getWallColumnForRune(row: number, runeType: RuneType, wallSize: number = 5): number {
  // Each row is rotated by 1
  // Fire, Frost, Life, Void, Wind -> 0, 1, 2, 3, 4
  // For 3 types: Fire, Life, Wind -> 0, 1, 2
  // For 4 types: Fire, Life, Wind, Frost -> 0, 1, 2, 3
  const runeTypeIndex: Record<RuneType, number> = {
    Fire: 0,
    Frost: 3,  // Only used when wallSize >= 4
    Life: 1,
    Void: 4,   // Only used when wallSize === 5
    Wind: 2,
  };
  
  const baseIndex = runeTypeIndex[runeType];
  // Rotate based on row, use wall size for modulo
  return (baseIndex + row) % wallSize;
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
 * Passive effects are inherited from the first rune placed on a pattern line.
 */
export function calculateProjectedPower(
  wall: ScoringWall,
  completedPatternLines: Array<{ row: number; runeType: RuneType; effects?: RuneEffects | null }>,
  floorPenaltyCount: number,
  gameMode: 'classic' | 'standard' = 'standard'
): { essence: number; focus: number; totalPower: number } {
  const wallSize = wall.length;
  const simulatedWall: ScoringWall = wall.map((row) => row.map((cell) => ({ ...cell })));

  for (const { row, runeType, effects } of completedPatternLines) {
    const col = getWallColumnForRune(row, runeType, wallSize);
    simulatedWall[row][col] = {
      runeType,
      effects: effects ? copyRuneEffects(effects) : getRuneEffectsForType(runeType),
    };
  }

  return calculateWallPowerWithSegments(simulatedWall, floorPenaltyCount, gameMode);
}
