/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType, RuneType } from '../../../types/game';
import { getRuneGlyph } from '../../../utils/runeHelpers';

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
  
  return (
    <div
      style={{ width: '40px', height: '40px' }}
      className="
        border-2 
        border-gray-600 
        rounded-lg 
        flex 
        items-center 
        justify-center 
        bg-gray-800
      "
    >
      {cell.runeType ? (
        <div className="text-3xl">{getRuneGlyph(cell.runeType)}</div>
      ) : (
        <div 
          style={{ 
            fontSize: '20px', 
            opacity: 0.3,
            filter: 'grayscale(100%)'
          }}
        >
          {getRuneGlyph(expectedRuneType)}
        </div>
      )}
    </div>
  );
}
