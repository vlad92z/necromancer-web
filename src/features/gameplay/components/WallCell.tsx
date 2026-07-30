/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { Rune, WallCell as WallCellType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { WALL_SLOT_PLACEHOLDER_ASSETS } from '../../../utils/wallSlotPlaceholders';
import { wallCellToRune } from '../../../utils/wallCellRune';
import type { RuneSize } from '../../../styles/tokens';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  pulseKey?: number;
  size?: RuneSize;
  onRuneHover?: (rune: Rune) => void;
  onRuneLeave?: () => void;
}

export function WallCell({
  cell,
  row,
  col,
  pulseKey,
  size = 'large',
  onRuneHover,
  onRuneLeave,
}: WallCellProps) {
  const acceptedRuneType = cell.acceptedRuneTypes[0];
  const placeholderLabel = cell.acceptedRuneTypes.join('/');
  const rune = wallCellToRune(cell, row, col);
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      aria-label={`${placeholderLabel} rune cell`}
      onMouseEnter={() => rune && onRuneHover?.(rune)}
      onMouseLeave={onRuneLeave}
    >
      <RuneCell
        rune={rune}
        variant="wall"
        size={size}
        emptyIcon={acceptedRuneType ? WALL_SLOT_PLACEHOLDER_ASSETS[acceptedRuneType] : undefined}
        placeholder={{
          type: 'rune',
        }}
        runePulseKey={pulseKey}
      />
    </div>
  );
}
