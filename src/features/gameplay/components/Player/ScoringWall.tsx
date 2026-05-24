/**
 * ScoringWall component - displays the charged spell wall.
 */

import { useCallback } from 'react';
import { useGameplayActions, useUIActions } from '../../../../hooks/useGameActions';
import { useGameplayWallState } from '../../../../hooks/useGameState';
import type { RuneType } from '../../../../types/game';
import { getRuneOrderForSize } from '../../../../utils/scoring';
import { WallCell } from '../WallCell';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
import { wallCellToRune } from '../../../../utils/wallCellRune';

const GAP = 4;
const cellKey = (row: number, col: number) => `${row}-${col}`;

interface ScoringWallProps {
  hiddenWallSlots: Set<string>;
}

export function ScoringWall({ hiddenWallSlots }: ScoringWallProps) {
  const { wall, wallCharges } = useGameplayWallState();
  const { castRuneToWall } = useGameplayActions();
  const { setTooltipCards, resetTooltipCards } = useUIActions();

  const handleWallCellEnter = useCallback(
    (rowIndex: number, colIndex: number) => {
      const cell = wall[rowIndex]?.[colIndex];
      if (!cell?.runeType) {
        resetTooltipCards();
        return;
      }

      const rune = wallCellToRune(cell, rowIndex, colIndex);
      if (!rune) {
        resetTooltipCards();
        return;
      }

      setTooltipCards(buildRuneTooltipCards([rune], rune.id));
    },
    [resetTooltipCards, setTooltipCards, wall]
  );

  const handleWallCellLeave = useCallback(() => {
    resetTooltipCards();
  }, [resetTooltipCards]);

  const handleWallCellClick = useCallback(
    (rowIndex: number, colIndex: number) => {
      castRuneToWall(rowIndex, colIndex);
    },
    [castRuneToWall]
  );

  const gridSize = wall.length;
  const availableRuneTypes: RuneType[] = getRuneOrderForSize(gridSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: `${GAP}px` }}>
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              data-wall-row={rowIndex}
              data-wall-col={colIndex}
              onMouseEnter={() => handleWallCellEnter(rowIndex, colIndex)}
              onMouseLeave={handleWallCellLeave}
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
                    ? { runeType: null, rarity: null, castEffectRefs: null, passiveEffectRefs: null }
                    : cell
                }
                charge={wallCharges[rowIndex]?.[colIndex] ?? null}
                row={rowIndex}
                col={colIndex}
                wallSize={gridSize}
                availableRuneTypes={availableRuneTypes}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
