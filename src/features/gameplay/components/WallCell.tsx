/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { SpellWallCharge, WallCell as WallCellType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getWallSlotFamily, getWallSlotFamilyLabel } from '../../../utils/scoring';
import { WALL_SLOT_PLACEHOLDER_ASSETS } from '../../../utils/wallSlotPlaceholders';
import { wallCellToRune } from '../../../utils/wallCellRune';

interface WallCellProps {
  cell: WallCellType;
  charge: SpellWallCharge | null;
  row: number;
  col: number;
  // Number of columns/rows of the scoring wall (3, 4 or 5)
  wallSize: number;
  pulseKey?: number;
}

export function WallCell({ cell, charge, row, col, wallSize, pulseKey }: WallCellProps) {
  void wallSize;
  const slotFamily = charge?.slotFamily ?? getWallSlotFamily(row, col);
  const lockedRuneType = !cell.runeType ? charge?.lockedRuneType ?? null : null;
  const placeholderLabel = lockedRuneType ?? getWallSlotFamilyLabel(slotFamily);
  const showChargeText = !cell.runeType && charge !== null && charge.currentCount > 0;
  
  const rune = wallCellToRune(cell, row, col);
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      aria-label={`${placeholderLabel} rune cell`}
    >
      <RuneCell
        rune={rune}
        variant="wall"
        size="large"
        emptyIcon={lockedRuneType ? undefined : WALL_SLOT_PLACEHOLDER_ASSETS[slotFamily]}
        placeholder={{
          type: 'rune',
          runeType: lockedRuneType ?? undefined,
        }}
        showEffect
        showTooltip={false}
        runePulseKey={pulseKey}
      />
      {showChargeText && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: '#f8fafc',
            fontSize: 16,
            fontWeight: 900,
            textShadow: '0 2px 8px rgba(2, 6, 23, 0.95)',
          }}
          aria-hidden="true"
        >
          {charge.currentCount}/{charge.requiredCount}
        </div>
      )}
    </div>
  );
}
