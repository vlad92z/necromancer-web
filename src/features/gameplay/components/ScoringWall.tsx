/**
 * ScoringWall component - displays the 5x5 scoring grid
 */

import type { ScoringWall as ScoringWallType } from '../../../types/game';
import { WallCell } from './WallCell';

interface ScoringWallProps {
  wall: ScoringWallType;
}

export function ScoringWall({ wall }: ScoringWallProps) {
  return (
    <div className="space-y-1">
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((cell, colIndex) => (
            <WallCell key={colIndex} cell={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}
