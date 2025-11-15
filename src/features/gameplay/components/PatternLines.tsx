/**
 * PatternLines component - displays a player's pattern lines
 */

import type { PatternLine } from '../../../types/game';
import { getRuneGlyph } from '../../../utils/runeHelpers';

interface PatternLinesProps {
  patternLines: PatternLine[];
}

export function PatternLines({ patternLines }: PatternLinesProps) {
  return (
    <div className="space-y-2">
      {patternLines.map((line, index) => (
        <div key={index} className="flex items-center gap-1">
          {/* Empty slots */}
          {Array(line.tier)
            .fill(null)
            .map((_, slotIndex) => (
              <div
                key={slotIndex}
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
                {slotIndex < line.count && line.runeType ? (
                  <div className="text-lg">{getRuneGlyph(line.runeType)}</div>
                ) : (
                  <div className="text-gray-600 text-xs">{line.tier}</div>
                )}
              </div>
            ))}
          <div className="text-gray-400 text-sm ml-2">
            {line.count}/{line.tier}
          </div>
        </div>
      ))}
    </div>
  );
}
