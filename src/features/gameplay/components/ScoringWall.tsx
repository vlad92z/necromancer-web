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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: '4px' }}>
          {row.map((cell, colIndex) => (
            <WallCell key={colIndex} cell={cell} row={rowIndex} col={colIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}
