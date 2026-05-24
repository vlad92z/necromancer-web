/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { SpellWallCharge, WallCell as WallCellType, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getExpectedRuneType } from '../../../utils/scoring';
import { wallCellToRune } from '../../../utils/wallCellRune';

interface WallCellProps {
  cell: WallCellType;
  charge: SpellWallCharge | null;
  row: number;
  col: number;
  // Number of columns/rows of the scoring wall (3, 4 or 5)
  wallSize: number;
  // Rune types available for this wall size (ordered)
  availableRuneTypes: RuneType[];
  pulseKey?: number;
}

export function WallCell({ cell, charge, row, col, wallSize, availableRuneTypes, pulseKey }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col, wallSize);
  void availableRuneTypes;
  const showChargeText = !cell.runeType && charge !== null && charge.currentCount > 0;
  
  const rune = wallCellToRune(cell, row, col);
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
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
