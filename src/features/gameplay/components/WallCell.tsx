/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { WALL_SLOT_PLACEHOLDER_ASSETS } from '../../../utils/wallSlotPlaceholders';
import { wallCellToRune } from '../../../utils/wallCellRune';
import type { RuneSize } from '../../../styles/tokens';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  // Number of columns/rows of the scoring wall.
  wallSize: number;
  pulseKey?: number;
  size?: RuneSize;
}

export function WallCell({ cell, row, col, wallSize, pulseKey, size = 'large' }: WallCellProps) {
  const acceptedRuneType = cell.acceptedRuneTypes[0];
  const placeholderLabel = cell.acceptedRuneTypes.join('/');
  const rune = wallCellToRune(cell, row, col);
  const tooltipPlacement = row < wallSize / 2 ? 'bottom' : 'top';
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      aria-label={`${placeholderLabel} rune cell`}
    >
      <RuneCell
        rune={rune}
        variant="wall"
        size={size}
        emptyIcon={acceptedRuneType ? WALL_SLOT_PLACEHOLDER_ASSETS[acceptedRuneType] : undefined}
        placeholder={{
          type: 'rune',
        }}
        showEffect
        showTooltip={rune !== null}
        tooltipRune={rune}
        tooltipPlacement={tooltipPlacement}
        runePulseKey={pulseKey}
      />
    </div>
  );
}
