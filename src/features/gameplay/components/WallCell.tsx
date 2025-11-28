/**
 * WallCell component - displays a single cell in the scoring wall
 */

import { useState } from 'react';
import type { WallCell as WallCellType, RuneType, PatternLine } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getWallColumnForRune } from '../../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType } from '../../../utils/runeEffects';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  patternLine: PatternLine;
  // Number of columns/rows of the scoring wall (3, 4 or 5)
  wallSize: number;
  // Rune types available for this wall size (ordered)
  availableRuneTypes: RuneType[];
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
  const fallback: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind'];
  const baseIndex = (col - row + fallback.length) % fallback.length;
  return fallback[baseIndex];
}

export function WallCell({ cell, row, col, patternLine, wallSize, availableRuneTypes }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col, wallSize, availableRuneTypes);
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if the pattern line is full and matches this cell's expected rune type
  const isPatternLineFull = patternLine.count === patternLine.tier;
  const patternLineMatchesCell = patternLine.runeType === expectedRuneType;
  const isPending = !cell.runeType && isPatternLineFull && patternLineMatchesCell;
  
  // Convert WallCell to Rune format if occupied
  const rune = cell.runeType ? {
    id: `wall-${row}-${col}`,
    runeType: cell.runeType,
    effects: copyRuneEffects(cell.effects ?? getRuneEffectsForType(cell.runeType)),
  } : null;
  
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={0}
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
        showEffect={false}
        isPending={isPending}
      />

      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(240px, 70vw)',
            padding: '10px 14px',
            background: 'rgba(3, 7, 18, 0.95)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5f5',
            fontSize: '1rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            boxShadow: '0 20px 45px rgba(0,0,0,0.55)',
            zIndex: 5
          }}
        >
          {getRuneDescription(expectedRuneType)}
        </div>
      )}
    </div>
  );
}

function getRuneDescription(type: RuneType) {
  switch (type) {
    case 'Fire':
      return 'Fire - increases ⚡Essence to deal more damage.';
    case 'Frost':
      return 'Frost - each rune dampens next round\'s strain growth by 10%.';
    case 'Life':
      return 'Life - increases 🌿healing done every round.';
    case 'Void':
      return 'Void - each rune converts 10% of projected incoming damage into spellpower.';
    case 'Wind':
      return 'Wind - reduces Overload penalties.';
    default:
      return `${type} rune`;
  }
}
