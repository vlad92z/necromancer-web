/**
 * ScoringWall component - displays the scoring grid
 */

import { useState } from 'react';
import { WallCell } from '../SpellWallCell';
import { useSoloGameStore } from '../../../../state/stores/soloGameStore';

const cellKey = (row: number, col: number) => `${row}-${col}`;

export function SpellWallView() {
  const wall = useSoloGameStore((state) => state.spellWall);
  const [pulseTarget, setPulseTarget] = useState<string | null>(null);

  // Add pulsing effects while scoring runes TODO
  // useEffect(() => {
  //   if (!scoringSequence || scoringSequence.activeIndex < 0) {
  //     setPulseTargets(new Set());
  //     return;
  //   }

  //   const activeStep = scoringSequence.steps[scoringSequence.activeIndex];
  //   if (!activeStep) {
  //     return;
  //   }

  //   setPulseTargets(new Set([cellKey(activeStep.row, activeStep.col)]));
  //   setPulseKey((prev) => prev + 1);
  // }, [scoringSequence]);

  return (
    <div className='flex flex-col gap-1'>
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} className='flex gap-1'>
          {row.map((cell, colIndex) => (
            <div key={colIndex}>
              <WallCell
                type={cell.runeType}
                rune={null}
                pulseKey={pulseTarget === cellKey(rowIndex, colIndex) ? 0 : undefined}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
