/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { SpellWallCharge, WallCell as WallCellType, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getRuneOrderForSize, getWallColumnForRune } from '../../../utils/scoring';
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

// Calculate which rune type belongs in this wall cell.
function getExpectedRuneType(
  row: number,
  col: number,
  wallSize: number,
  availableRuneTypes: RuneType[]
): RuneType {
  // Try to find which rune type maps to this (row, col) using the
  // same rotation logic as `getWallColumnForRune`.
  for (const t of availableRuneTypes) {
    const c = getWallColumnForRune(row, t, wallSize);
    if (c === col) return t;
  }

  // Fallback: if nothing matched (shouldn't happen), pick from a full list
  const fallback = getRuneOrderForSize(wallSize);
  const baseIndex = (col - row + fallback.length) % fallback.length;
  return fallback[baseIndex];
}

export function WallCell({ cell, charge, row, col, wallSize, availableRuneTypes, pulseKey }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col, wallSize, availableRuneTypes);
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
