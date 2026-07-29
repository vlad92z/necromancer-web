/**
 * ScoringWall component - displays the player's spell wall.
 */

import { useCallback } from 'react';
import { useGameplayActions } from '../../../../hooks/useGameActions';
import { useGameplayWallState } from '../../../../hooks/useGameState';
import { WallCell } from '../WallCell';

const cellKey = (row: number, col: number) => `${row}-${col}`;

interface ScoringWallProps {
  hiddenWallSlots: Set<string>;
}

export function ScoringWall({ hiddenWallSlots }: ScoringWallProps) {
  const { wall } = useGameplayWallState();
  const { castRuneToWall } = useGameplayActions();

  const handleWallCellClick = useCallback(
    (rowIndex: number, colIndex: number) => {
      castRuneToWall(rowIndex, colIndex);
    },
    [castRuneToWall]
  );

  const gridSize = wall.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column'}}>
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex' }}>
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
              style={{ display: 'flex', cursor: 'pointer' }}
            >
              <WallCell
                cell={
                  hiddenWallSlots.has(cellKey(rowIndex, colIndex))
                    ? { id: null, runeType: null, rarity: null, castEffectRefs: null, passiveEffectRefs: null }
                    : cell
                }
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
