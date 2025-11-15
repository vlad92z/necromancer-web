/**
 * ScoringWall component - displays the 5x5 scoring grid
 */

import type { ScoringWall as ScoringWallType } from '../types/game';
import { getRuneGlyph } from '../utils/runeHelpers';

interface ScoringWallProps {
  wall: ScoringWallType;
}

export function ScoringWall({ wall }: ScoringWallProps) {
  return (
    <div className="space-y-1">
      {wall.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className="
                w-10 
                h-10 
                border-2 
                border-gray-600 
                rounded-lg 
                flex 
                items-center 
                justify-center 
                bg-gray-800
              "
            >
              {cell.runeType ? (
                <div className="text-lg">{getRuneGlyph(cell.runeType)}</div>
              ) : (
                <div className="text-gray-700 text-xs">·</div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
