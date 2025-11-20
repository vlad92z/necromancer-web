/**
 * WallCell component - displays a single cell in the scoring wall
 */

import { useState } from 'react';
import type { WallCell as WallCellType, RuneType, PatternLine } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  patternLine: PatternLine;
}

// Calculate which rune type belongs in this cell based on Azul pattern
function getExpectedRuneType(row: number, col: number): RuneType {
  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Life', 'Void', 'Wind'];
  // Reverse the rotation: subtract row from col to find the base index
  const baseIndex = (col - row + 5) % 5;
  return runeTypes[baseIndex];
}

export function WallCell({ cell, row, col, patternLine }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col);
  const [isHovered, setIsHovered] = useState(false);
  
  // Check if the pattern line is full and matches this cell's expected rune type
  const isPatternLineFull = patternLine.count === patternLine.tier;
  const patternLineMatchesCell = patternLine.runeType === expectedRuneType;
  const isPending = !cell.runeType && isPatternLineFull && patternLineMatchesCell;
  
  // Convert WallCell to Rune format if occupied
  const rune = cell.runeType ? {
    id: `wall-${row}-${col}`,
    runeType: cell.runeType,
    effect: { type: 'None' as const }
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
      return 'Frost - placing Frost runes lets you freeze enemy pattern lines.';
    case 'Life':
      return 'Life - increases 🌿healing done every round.';
    case 'Void':
      return 'Void - placing Void runes lets you destroy unclaimed runes.';
    case 'Wind':
      return 'Wind - reduces Overload penalties.';
    default:
      return `${type} rune`;
  }
}
