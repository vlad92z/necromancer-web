/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { Rune, WallCell as WallCellType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import slotRune from '../../../assets/runes/slot_rune.png';
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
  const rune = wallCellToRune(cell, row, col);
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      aria-label="Empty rune cell"
      onMouseEnter={() => rune && onRuneHover?.(rune)}
      onMouseLeave={onRuneLeave}
    >
      <RuneCell
        rune={rune}
        variant="wall"
        size={size}
        emptyIcon={slotRune}
        placeholder={{
          type: 'rune',
        }}
        runePulseKey={pulseKey}
      />
    </div>
  );
}
