/**
 * Helper utilities for wall cell state management
 */

import type { WallCell, WallCellState, ScoringWall, RuneType } from '../types/game';

/**
 * Get the required number of runes for a cell based on its row index
 * Row 0 requires 1 rune, row 1 requires 2, row 2 requires 3, etc.
 */
export function getRequiredRuneCount(rowIndex: number): number {
  return rowIndex + 1;
}

/**
 * Derive the state of a wall cell based on its properties
 */
export function getWallCellState(cell: WallCell, rowIndex: number): WallCellState {
  const required = getRequiredRuneCount(rowIndex);
  
  if (cell.placedCount === 0) {
    return 'Empty';
  }
  
  if (cell.placedCount < required) {
    return 'InProgress';
  }
  
  return 'Completed';
}

/**
 * Check if a cell is selectable for placement
 * A cell is selectable if:
 * - It's not locked
 * - It's Empty or InProgress with matching rune type
 * - It's not Completed
 */
export function isCellSelectable(
  cell: WallCell,
  rowIndex: number,
  selectedRuneType: RuneType | null
): boolean {
  if (cell.locked) {
    return false;
  }
  
  const state = getWallCellState(cell, rowIndex);
  
  if (state === 'Completed') {
    return false;
  }
  
  if (state === 'Empty') {
    return selectedRuneType !== null;
  }
  
  // InProgress - must match type
  return cell.runeType === selectedRuneType;
}

/**
 * Get all InProgress cells in a given row
 */
export function getInProgressCellsInRow(wall: ScoringWall, rowIndex: number): number[] {
  const row = wall[rowIndex];
  if (!row) return [];
  
  return row
    .map((cell, colIndex) => ({ cell, colIndex }))
    .filter(({ cell }) => getWallCellState(cell, rowIndex) === 'InProgress')
    .map(({ colIndex }) => colIndex);
}

/**
 * Check if any cell in a row is InProgress
 */
export function hasInProgressCellInRow(wall: ScoringWall, rowIndex: number): boolean {
  return getInProgressCellsInRow(wall, rowIndex).length > 0;
}

/**
 * Update lock states for cells in a row based on the new rule:
 * - When any cell in a row becomes Completed, all other cells in that row become Locked
 * - When a cell becomes InProgress, all other Empty cells in that row become Locked
 * - InProgress cells cannot be locked
 * 
 * Returns a new wall with updated lock states
 */
export function updateRowLockStates(wall: ScoringWall): ScoringWall {
  return wall.map((row, rowIndex) => {
    // Check if any cell in this row is Completed
    const hasCompletedCell = row.some((cell) => 
      getWallCellState(cell, rowIndex) === 'Completed'
    );
    
    // Check if any cell in this row is InProgress
    const inProgressCells = getInProgressCellsInRow(wall, rowIndex);
    const hasInProgressCell = inProgressCells.length > 0;
    
    return row.map((cell, colIndex) => {
      const cellState = getWallCellState(cell, rowIndex);
      
      // InProgress cells can never be locked
      if (cellState === 'InProgress') {
        return { ...cell, locked: false };
      }
      
      // If there's a completed cell in this row, lock all other cells
      if (hasCompletedCell && cellState !== 'Completed') {
        return { ...cell, locked: true };
      }
      
      // If there's an InProgress cell and this is Empty, lock it
      if (hasInProgressCell && cellState === 'Empty') {
        return { ...cell, locked: true };
      }
      
      // Otherwise, don't lock
      return { ...cell, locked: false };
    });
  });
}

/**
 * Reset locked cells at the start of a new round
 * All locked cells that are Empty should be unlocked
 * InProgress locking rules still apply
 */
export function resetLockedCells(wall: ScoringWall): ScoringWall {
  // First, unlock all Empty and Completed cells
  const unlockedWall = wall.map((row, rowIndex) => 
    row.map((cell) => {
      const state = getWallCellState(cell, rowIndex);
      // Keep InProgress cells as they were, unlock others
      if (state === 'Empty' || state === 'Completed') {
        return { ...cell, locked: false };
      }
      return cell;
    })
  );
  
  // Then reapply InProgress locking rules
  return updateRowLockStates(unlockedWall);
}
