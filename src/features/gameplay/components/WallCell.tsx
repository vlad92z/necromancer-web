/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getRuneOrderForSize, getWallColumnForRune } from '../../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType } from '../../../utils/runeEffects';
import { RuneView } from '../../../components/RuneView';
import { RUNE_SIZE_CONFIG } from '../../../styles/tokens';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  wallSize: number;
  availableRuneTypes: RuneType[];
  pulseKey?: number;
}

// Calculate which rune type belongs in this cell based on Azul pattern
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

export function WallCell({ cell, row, col, wallSize, availableRuneTypes, pulseKey }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col, wallSize, availableRuneTypes);

  // Convert WallCell to Rune format if occupied
  const rune = cell.runeType ? {
    id: `wall-${row}-${col}`,
    runeType: cell.runeType,
    effects: copyRuneEffects(cell.effects ?? getRuneEffectsForType(cell.runeType)),
  } : null;

  const imageDimension = RUNE_SIZE_CONFIG['large'].dimension;
  const borderColor = rune === null ? 'border-slate-600 opacity-50' : 'border-slate-400';
  const backgroundColor = rune === null ? '' : 'bg-sky-700/50';
  return (
    <div
    className={`border rounded-xl ${borderColor} ${backgroundColor} align-center`}
    style={{ width: imageDimension, height: imageDimension }}>
      <RuneView type={expectedRuneType} rarity={rune?.effects[0]?.rarity ?? 'common'} runePulseKey={pulseKey} runePulseScale={pulseKey ? 1.2 : 1} />
    </div>
  );

}
