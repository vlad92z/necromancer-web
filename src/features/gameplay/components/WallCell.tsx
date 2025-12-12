/**
 * WallCell component - displays a single cell in the scoring wall
 * Now supports direct placement with Empty/InProgress/Completed states
 */

import type { WallCell as WallCellType, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getRuneOrderForSize, getWallColumnForRune } from '../../../utils/scoring';
import { copyRuneEffects, getRuneEffectsForType } from '../../../utils/runeEffects';
import { getWallCellState, getRequiredRuneCount } from '../../../utils/wallCellHelpers';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  // Number of columns/rows of the scoring wall (3, 4 or 5)
  wallSize: number;
  // Rune types available for this wall size (ordered)
  availableRuneTypes: RuneType[];
  pulseKey?: number;
  // New props for interactivity
  onClick?: () => void;
  isSelectable?: boolean;
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

export function WallCell({ cell, row, col, wallSize, availableRuneTypes, pulseKey, onClick, isSelectable }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col, wallSize, availableRuneTypes);
  const cellState = getWallCellState(cell, row);
  const requiredCount = getRequiredRuneCount(row);
  
  // Convert WallCell to Rune format if it has a primary rune
  const rune = cell.runeType ? {
    id: `wall-${row}-${col}`,
    runeType: cell.runeType,
    effects: copyRuneEffects(cell.effects ?? getRuneEffectsForType(cell.runeType)),
  } : null;
  
  const showProgressCounter = cellState === 'Empty' || cellState === 'InProgress';
  const isCompleted = cellState === 'Completed';
  const isLocked = cell.locked;
  
  return (
    <div
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        cursor: isSelectable ? 'pointer' : 'default',
      }}
      tabIndex={0}
      aria-label={`${expectedRuneType} rune cell, ${cellState}, ${cell.placedCount}/${requiredCount}`}
      onClick={onClick}
    >
      <RuneCell
        rune={rune}
        variant="wall"
        size="large"
        placeholder={{
          type: 'rune',
          runeType: expectedRuneType,
        }}
        showEffect={isCompleted}
        showTooltip={false}
        runePulseKey={pulseKey}
      />
      
      {/* Progress counter for Empty and InProgress cells */}
      {showProgressCounter && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            color: 'rgba(226, 232, 240, 0.95)',
            fontSize: '11px',
            fontWeight: '600',
            padding: '2px 5px',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10,
            border: '1px solid rgba(51, 65, 85, 0.6)',
          }}
        >
          {cell.placedCount}/{requiredCount}
        </div>
      )}
      
      {/* Lock icon for locked cells */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
            }}
          >
            <rect x="6" y="10" width="12" height="10" rx="2" fill="rgba(71, 85, 105, 0.9)" stroke="rgba(148, 163, 184, 0.8)" strokeWidth="1.5"/>
            <path d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10" stroke="rgba(148, 163, 184, 0.8)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="15" r="1.5" fill="rgba(203, 213, 225, 0.9)"/>
          </svg>
        </div>
      )}
      
      {/* Completed cell indicator (yellow background) */}
      {isCompleted && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(234, 179, 8, 0.25)',
            borderRadius: '12px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
    </div>
  );
}
