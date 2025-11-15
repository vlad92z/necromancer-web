/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType } from '../../../types/game';
import { getRuneGlyph } from '../../../utils/runeHelpers';

interface WallCellProps {
  cell: WallCellType;
}

export function WallCell({ cell }: WallCellProps) {
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
        <div className="text-gray-700 text-l">+</div>
      )}
    </div>
  );
}
