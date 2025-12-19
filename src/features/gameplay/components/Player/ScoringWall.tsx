/**
 * ScoringWall component - displays the scoring grid
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScoringWall as ScoringWallType, PatternLine } from '../../../../types/game';
import { collectSegmentCells, getRuneOrderForSize, getWallColumnForRune } from '../../../../utils/scoring';
import { WallCell } from '../WallCell';
import type { RuneType } from '../../../../types/game';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';

interface ScoringWallProps {
  wall: ScoringWallType;
  patternLines: PatternLine[];
}
const cellKey = (row: number, col: number) => `${row}-${col}`;


// We no longer compute the largest connected component. Instead we connect
// every occupied or pending cell to its orthogonal neighbors (right + down).

export function ScoringWall({ wall, patternLines }: ScoringWallProps) {
  const [pulseKey, setPulseKey] = useState(0);
  const [pulseTargets, setPulseTargets] = useState<Set<string>>(new Set());
  const scoringSequence = useGameplayStore((state) => state.scoringSequence);

  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);

  // Adds the tooltip when mousing over
  const handleWallCellEnter = useCallback((rowIndex: number, colIndex: number) => {
      const segmentCells = collectSegmentCells(wall, rowIndex, colIndex);
      if (segmentCells.length === 0) {
        return;
      }

      const primaryCell = segmentCells.find((cell) => cell.row === rowIndex && cell.col === colIndex);
      const remainingCells = segmentCells
        .filter((cell) => !(cell.row === rowIndex && cell.col === colIndex))
        .sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row));
      const orderedCells = primaryCell ? [primaryCell, ...remainingCells] : remainingCells;

      const tooltipRunes = orderedCells
        .filter((cell) => cell.runeType !== null)
        .map((cell) => ({
          id: `wall-${cell.row}-${cell.col}`,
          runeType: (cell.runeType ?? 'Life') as RuneType,
          effects: cell.effects ?? [],
        }));

      if (tooltipRunes.length === 0) {
        resetTooltipCards();
        return;
      }

      setTooltipCards(buildRuneTooltipCards(tooltipRunes, tooltipRunes[0].id));
    },
    [resetTooltipCards, setTooltipCards, wall]
  );

  // Add pulsing effects while scoring runes
  useEffect(() => {
    if (!scoringSequence || scoringSequence.activeIndex < 0) {
      setPulseTargets(new Set());
      return;
    }

    const activeStep = scoringSequence.steps[scoringSequence.activeIndex];
    if (!activeStep) {
      return;
    }

    setPulseTargets(new Set([cellKey(activeStep.row, activeStep.col)]));
    setPulseKey((prev) => prev + 1);
  }, [scoringSequence]);

  const gridSize = wall.length;
  const availableRuneTypes: RuneType[] = getRuneOrderForSize(gridSize);

  return (
      <div className='flex flex-col gap-px-1'>
        { wall.map((row, rowIndex) => (
          <div key={rowIndex} className='flex gap-1'>
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                onMouseEnter={() => handleWallCellEnter(rowIndex, colIndex)}
                onMouseLeave={resetTooltipCards}
              >
                <WallCell
                  cell={cell}
                  row={rowIndex}
                  col={colIndex}
                  wallSize={gridSize}
                  availableRuneTypes={availableRuneTypes}
                  pulseKey={pulseTargets.has(cellKey(rowIndex, colIndex)) ? pulseKey : undefined}
                />
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
