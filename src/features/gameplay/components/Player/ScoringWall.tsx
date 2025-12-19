/**
 * ScoringWall component - displays the scoring grid
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collectSegmentCells } from '../../../../utils/scoring';
import { SpellWallCell } from '../WallCell';
import type { RuneType } from '../../../../types/game';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';

const cellKey = (row: number, col: number) => `${row}-${col}`;

export function ScoringWall() {
  const wall = useGameplayStore((state) => state.player.wall);
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
                <SpellWallCell
                  type={cell.runeType}
                  rune={null}
                  pulseKey={pulseTargets.has(cellKey(rowIndex, colIndex)) ? pulseKey : undefined}
                />
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
