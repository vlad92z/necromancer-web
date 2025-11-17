/**
 * ScoringWall component - displays the 5x5 scoring grid
 */

import type { ScoringWall as ScoringWallType, PatternLine } from '../../../types/game';
import { WallCell } from './WallCell';

interface ScoringWallProps {
  wall: ScoringWallType;
  patternLines: PatternLine[];
}

export function ScoringWall({ wall, patternLines }: ScoringWallProps) {
  const isMobile = window.innerWidth < 768;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '2px' : '4px' }}>
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: 'flex', gap: isMobile ? '2px' : '4px' }}>
          {row.map((cell, colIndex) => (
            <WallCell 
              key={colIndex} 
              cell={cell} 
              row={rowIndex} 
              col={colIndex}
              patternLine={patternLines[rowIndex]}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
