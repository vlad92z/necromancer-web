/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType, RuneType, PatternLine } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  patternLine: PatternLine;
}

// Calculate which rune type belongs in this cell based on Azul pattern
function getExpectedRuneType(row: number, col: number): RuneType {
  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind'];
  // Reverse the rotation: subtract row from col to find the base index
  const baseIndex = (col - row + 5) % 5;
  return runeTypes[baseIndex];
}

export function WallCell({ cell, row, col, patternLine }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col);
  
  // Check if the pattern line is full and matches this cell's expected rune type
  const isPatternLineFull = patternLine.count === patternLine.tier;
  const patternLineMatchesCell = patternLine.runeType === expectedRuneType;
  const isPending = !cell.runeType && isPatternLineFull && patternLineMatchesCell;
  
  // Convert WallCell to Rune format if occupied
  const rune = cell.runeType ? {
    id: `wall-${row}-${col}`,
    runeType: cell.runeType,
    effect: { type: 'None' as const }
  } : null;
  
  return (
    <RuneCell
      rune={rune}
      variant="wall"
      size="large"
      placeholder={{
        type: 'rune',
        runeType: expectedRuneType,
      }}
      showEffect={false}
      isPending={isPending}
    />
  );
}
