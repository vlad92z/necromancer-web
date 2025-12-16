/**
 * Navigation grid helpers for keyboard/touch active element tracking.
 */

import type { ActiveElement, PatternLine, Runeforge, ScoringWall } from '../types/game';
import type { ArtefactId } from '../types/artefacts';

export type NavigationCell = ActiveElement | null;
export type NavigationDirection = 'up' | 'down' | 'left' | 'right';

interface NavigationGridContext {
  runeforges: Runeforge[];
  runesPerRuneforge: number;
  patternLines: PatternLine[];
  wall: ScoringWall;
  artefactIds: ArtefactId[];
}

const elementsEqual = (a: ActiveElement, b: ActiveElement): boolean => {
  if (a.type !== b.type) {
    return false;
  }

  switch (a.type) {
    case 'runeforge-rune':
      return (
        b.type === 'runeforge-rune' &&
        a.runeforgeIndex === b.runeforgeIndex &&
        a.runeIndex === b.runeIndex
      );
    case 'pattern-line':
      return b.type === 'pattern-line' && a.lineIndex === b.lineIndex;
    case 'scoring-wall':
      return b.type === 'scoring-wall' && a.row === b.row && a.col === b.col;
    case 'artefact':
      return b.type === 'artefact' && a.artefactIndex === b.artefactIndex;
    default:
      return true;
  }
};

export function buildNavigationGrid({
  runeforges,
  runesPerRuneforge,
  patternLines,
  wall,
  artefactIds,
}: NavigationGridContext): NavigationCell[][] {
  const rows: NavigationCell[][] = [];
  rows.push([{ type: 'settings' }, { type: 'overload' }, { type: 'deck' }]);

  const wallSize = wall.length;
  const totalRows = wallSize;
  const artefactSlots = Math.max(artefactIds.length, 5);

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
    const row: NavigationCell[] = [];
    const runeforge = runeforges[rowIndex];

    if (runeforge) {
      for (let runeIndex = 0; runeIndex < runesPerRuneforge; runeIndex++) {
        row.push({ type: 'runeforge-rune', runeforgeIndex: rowIndex, runeIndex });
      }
    } else if (rowIndex === totalRows - 1) {
      for (let artefactIndex = 0; artefactIndex < artefactSlots; artefactIndex++) {
        row.push({ type: 'artefact', artefactIndex });
      }
    }

    row.push({ type: 'pattern-line', lineIndex: rowIndex });

    for (let colIndex = 0; colIndex < wallSize; colIndex++) {
      row.push({ type: 'scoring-wall', row: rowIndex, col: colIndex });
    }

    rows.push(row);
  }

  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => {
    if (row.length >= maxColumns) {
      return row;
    }
    return [...row, ...Array(maxColumns - row.length).fill(null)];
  });
}

export function findElementPosition(
  grid: NavigationCell[][],
  target: ActiveElement | null
): { row: number; col: number } | null {
  if (!target) {
    return null;
  }
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];
      if (cell && elementsEqual(cell, target)) {
        return { row: rowIndex, col: colIndex };
      }
    }
  }
  return null;
}

export function getFirstAvailableElement(
  grid: NavigationCell[][],
  isElementActive: (element: ActiveElement) => boolean
): ActiveElement | null {
  for (const row of grid) {
    for (const cell of row) {
      if (cell && isElementActive(cell)) {
        return cell;
      }
    }
  }
  return null;
}

const findClosestInRow = (
  row: NavigationCell[],
  targetCol: number,
  isElementActive: (element: ActiveElement) => boolean
): { element: ActiveElement; col: number } | null => {
  let best: { element: ActiveElement; col: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  row.forEach((cell, index) => {
    if (!cell || !isElementActive(cell)) {
      return;
    }
    const distance = Math.abs(index - targetCol);
    if (distance < bestDistance) {
      best = { element: cell, col: index };
      bestDistance = distance;
    }
  });
  return best;
};

export function findNextElement(
  grid: NavigationCell[][],
  current: ActiveElement | null,
  direction: NavigationDirection,
  isElementActive: (element: ActiveElement) => boolean
): ActiveElement | null {
  const position = findElementPosition(grid, current);
  const targetCol = position?.col ?? 0;

  if (direction === 'left' || direction === 'right') {
    const rowIndex = position?.row ?? 0;
    const row = grid[rowIndex] ?? [];
    if (direction === 'left') {
      for (let col = targetCol - 1; col >= 0; col--) {
        const cell = row[col];
        if (cell && isElementActive(cell)) {
          return cell;
        }
      }
    } else {
      for (let col = targetCol + 1; col < row.length; col++) {
        const cell = row[col];
        if (cell && isElementActive(cell)) {
          return cell;
        }
      }
    }
    return current;
  }

  if (direction === 'up') {
    for (let rowIndex = (position?.row ?? grid.length) - 1; rowIndex >= 0; rowIndex--) {
      const row = grid[rowIndex];
      const closest = findClosestInRow(row, targetCol, isElementActive);
      if (closest) {
        return closest.element;
      }
    }
    return current;
  }

  for (let rowIndex = (position?.row ?? -1) + 1; rowIndex < grid.length; rowIndex++) {
    const row = grid[rowIndex];
    const closest = findClosestInRow(row, targetCol, isElementActive);
    if (closest) {
      return closest.element;
    }
  }

  return current;
}
