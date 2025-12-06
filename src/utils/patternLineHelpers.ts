/**
 * Helper utilities for pattern line operations
 */

import type { PatternLine, Rune, ScoringWall } from '../types/game';
import { getWallColumnForRune } from './scoring';

/**
 * Find the best pattern line index to auto-place selected runes.
 * Returns the index of the pattern line to use, or null if no suitable line exists.
 * 
 * Algorithm:
 * 1. First, try to find an unfinished pattern line of the matching rune type with enough space
 * 2. If not found, try to find an empty pattern line with exact capacity match
 * 3. If still not found, return null (fallback to cancel selection)
 */
export function findBestPatternLineForAutoPlacement(
  selectedRunes: Rune[],
  patternLines: PatternLine[],
  wall: ScoringWall,
  lockedLineIndexes: number[]
): number | null {
  if (selectedRunes.length === 0) {
    return null;
  }

  // Get the rune type from selected runes (assume all same type)
  const selectionType = selectedRunes[0].runeType;
  const selectionCount = selectedRunes.length;
  
  // Verify all selected runes are the same type
  const allSameType = selectedRunes.every((rune) => rune.runeType === selectionType);
  if (!allSameType) {
    return null; // Fallback to cancel if mixed types
  }

  const wallSize = wall.length;

  // Step 1: Look for unfinished pattern line of matching type with enough space
  for (let i = 0; i < patternLines.length; i++) {
    const line = patternLines[i];
    
    // Skip locked lines
    if (lockedLineIndexes.includes(i)) {
      continue;
    }

    // Check if line is not complete
    const isComplete = line.count === line.tier;
    if (isComplete) {
      continue;
    }

    // Check if line matches the rune type (or is empty but will become this type)
    const matchesType = line.runeType === null || line.runeType === selectionType;
    if (!matchesType) {
      continue;
    }

    // Check if there's enough space
    const availableSpace = line.tier - line.count;
    const hasEnoughSpace = selectionCount <= availableSpace;
    if (!hasEnoughSpace) {
      continue;
    }

    // Check if this rune type is already on the wall in this row
    const row = i;
    const col = getWallColumnForRune(row, selectionType, wallSize);
    const alreadyOnWall = wall[row][col].runeType !== null;
    if (alreadyOnWall) {
      continue;
    }

    // Found a suitable line!
    return i;
  }

  // Step 2: Look for empty pattern line with exact capacity match
  for (let i = 0; i < patternLines.length; i++) {
    const line = patternLines[i];
    
    // Skip locked lines
    if (lockedLineIndexes.includes(i)) {
      continue;
    }

    // Check if line is empty
    const isEmpty = line.count === 0;
    if (!isEmpty) {
      continue;
    }

    // Check if capacity exactly matches selection size
    const exactMatch = line.tier === selectionCount;
    if (!exactMatch) {
      continue;
    }

    // Check if this rune type is already on the wall in this row
    const row = i;
    const col = getWallColumnForRune(row, selectionType, wallSize);
    const alreadyOnWall = wall[row][col].runeType !== null;
    if (alreadyOnWall) {
      continue;
    }

    // Found a suitable line!
    return i;
  }

  // Step 3: No suitable line found
  return null;
}
