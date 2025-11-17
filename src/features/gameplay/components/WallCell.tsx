/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
}

// Calculate which rune type belongs in this cell based on Azul pattern
function getExpectedRuneType(row: number, col: number): RuneType {
  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Poison', 'Void', 'Wind'];
  // Reverse the rotation: subtract row from col to find the base index
  const baseIndex = (col - row + 5) % 5;
  return runeTypes[baseIndex];
}

export function WallCell({ cell, row, col }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col);
  
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
    />
  );
}
