/**
 * Helper utilities for pattern line operations
 */

import type { PatternLine, Rune, ScoringWall } from '../types/game';
import { getColumn } from './runeHelpers';

/**
 * Find the best pattern line index to auto-place selected runes.
 * Returns the index of the pattern line to use, or null if no suitable line exists.
 * 
 * @param selectedRunes - Array of runes currently selected by the player
 * @param patternLines - Array of pattern lines for the current player
 * @param wall - The player's scoring wall (2D grid of wall cells)
 * @param lockedLineIndexes - Array of pattern line indices that are locked (unavailable)
 * @returns The index of the best pattern line to place runes, or null if no suitable line found
 * 
 * Algorithm:
 * 1. First, try to find an unfinished pattern line that already has the matching rune type (regardless of capacity)
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

  // Verify all selected runes are the same type
  const firstRuneType = selectedRunes[0].runeType;
  const allSameType = selectedRunes.every((rune) => rune.runeType === firstRuneType);
  if (!allSameType) {
    return null; // Fallback to cancel if mixed types
  }

  // All runes verified to be same type
  const selectionType = firstRuneType;
  const selectionCount = selectedRunes.length;

  // Step 1: Look for unfinished pattern line that already has the matching rune type
  // Send runes there regardless of capacity (overflow will go to floor line)
  for (let i = 0; i < patternLines.length; i++) {
    const line = patternLines[i];

    // Skip locked lines
    if (lockedLineIndexes.includes(i)) {
      continue;
    }

    // Check if line is not complete
    const isComplete = line.runes.length === line.tier;
    if (isComplete) {
      continue;
    }

    // Check if line already has the matching rune type (not empty)
    const alreadyHasType = line.runes.length > 0 && line.runes[0].runeType === selectionType;
    if (!alreadyHasType) {
      continue;
    }

    // Check if this rune type is already on the wall in this row
    const col = getColumn(i, selectionType);
    const alreadyOnWall = wall[i][col].runeType !== null;
    if (alreadyOnWall) {
      continue;
    }

    // Found a suitable line! Send runes here even if there's overflow
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
    const isEmpty = line.runes.length === 0;
    if (!isEmpty) {
      continue;
    }

    // Check if capacity exactly matches selection size
    const exactMatch = line.tier === selectionCount;
    if (!exactMatch) {
      continue;
    }

    // Check if this rune type is already on the wall in this row
    const col = getColumn(i, selectionType);
    const alreadyOnWall = wall[i][col].runeType !== null;
    if (alreadyOnWall) {
      continue;
    }

    // Found a suitable line!
    return i;
  }

  // Step 3: No suitable line found
  return null;
}