/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType, RuneType, PatternLine } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getRuneOrderForSize, getWallColumnForRune } from '../../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType } from '../../../utils/runeEffects';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  patternLine: PatternLine;
  // Number of columns/rows of the scoring wall (3, 4 or 5)
  wallSize: number;
  // Rune types available for this wall size (ordered)
  availableRuneTypes: RuneType[];
}

// Calculate which rune type belongs in this cell based on Azul pattern
function getExpectedRuneType(
  row: number,
  col: number,
  wallSize: number,
  availableRuneTypes: RuneType[]
): RuneType {
  // Try to find which rune type maps to this (row, col) using the
  // same rotation logic as `getWallColumnForRune`.
  for (const t of availableRuneTypes) {
    const c = getWallColumnForRune(row, t, wallSize);
    if (c === col) return t;
  }

  // Fallback: if nothing matched (shouldn't happen), pick from a full list
  const fallback = getRuneOrderForSize(wallSize);
  const baseIndex = (col - row + fallback.length) % fallback.length;
  return fallback[baseIndex];
}

export function WallCell({ cell, row, col, patternLine, wallSize, availableRuneTypes }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col, wallSize, availableRuneTypes);
  
  // Check if the pattern line is full and matches this cell's expected rune type
  const isPatternLineFull = patternLine.count === patternLine.tier;
  const patternLineMatchesCell = patternLine.runeType === expectedRuneType;
  const isPending = !cell.runeType && isPatternLineFull && patternLineMatchesCell;
  
  // Convert WallCell to Rune format if occupied
  const rune = cell.runeType ? {
    id: `wall-${row}-${col}`,
    runeType: cell.runeType,
    effects: copyRuneEffects(cell.effects ?? getRuneEffectsForType(cell.runeType)),
  } : null;
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      tabIndex={0}
      aria-label={`${expectedRuneType} rune cell`}
    >
      <RuneCell
        rune={rune}
        variant="wall"
        size="large"
        placeholder={{
          type: 'rune',
          runeType: expectedRuneType,
        }}
        showEffect
        isPending={isPending}
        showTooltip
      />
    </div>
  );
}
