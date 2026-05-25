/**
 * ScoringWall component - displays the charged spell wall.
 */

import { useCallback } from 'react';
import { useGameplayActions } from '../../../../hooks/useGameActions';
import { useGameplayWallState } from '../../../../hooks/useGameState';
import { WallCell } from '../WallCell';

const GAP = 4;
const cellKey = (row: number, col: number) => `${row}-${col}`;

interface ScoringWallProps {
  hiddenWallSlots: Set<string>;
}

export function ScoringWall({ hiddenWallSlots }: ScoringWallProps) {
  const { wall, wallCharges } = useGameplayWallState();
  const { castRuneToWall } = useGameplayActions();

  const handleWallCellClick = useCallback(
    (rowIndex: number, colIndex: number) => {
      castRuneToWall(rowIndex, colIndex);
    },
    [castRuneToWall]
  );

  const gridSize = wall.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: `${GAP}px` }}>
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              data-wall-row={rowIndex}
              data-wall-col={colIndex}
              onClick={() => handleWallCellClick(rowIndex, colIndex)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleWallCellClick(rowIndex, colIndex);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <WallCell
                cell={
                  hiddenWallSlots.has(cellKey(rowIndex, colIndex))
                    ? { id: null, runeType: null, rarity: null, castEffectRefs: null, passiveEffectRefs: null }
                    : cell
                }
                charge={wallCharges[rowIndex]?.[colIndex] ?? null}
                row={rowIndex}
                col={colIndex}
                wallSize={gridSize}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
