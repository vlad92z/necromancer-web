/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType, WallSlotFamily } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getWallSlotFamily, getWallSlotFamilyLabel } from '../../../utils/scoring';
import { WALL_SLOT_PLACEHOLDER_ASSETS } from '../../../utils/wallSlotPlaceholders';
import { wallCellToRune } from '../../../utils/wallCellRune';
import type { RuneSize } from '../../../styles/tokens';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  // Number of columns/rows of the scoring wall.
  wallSize: number;
  slotFamily?: WallSlotFamily;
  pulseKey?: number;
  size?: RuneSize;
}

export function WallCell({ cell, row, col, wallSize, slotFamily, pulseKey, size = 'large' }: WallCellProps) {
  const resolvedSlotFamily = slotFamily ?? getWallSlotFamily(row, col);
  const placeholderLabel = getWallSlotFamilyLabel(resolvedSlotFamily);
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
        emptyIcon={WALL_SLOT_PLACEHOLDER_ASSETS[resolvedSlotFamily]}
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
