/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import type { PatternLine, RuneType } from '../../../types/game';
import { getRuneGlyph } from '../../../utils/runeHelpers';

interface PatternLinesProps {
  patternLines: PatternLine[];
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
}

export function PatternLines({ patternLines, onPlaceRunes, selectedRuneType, canPlace }: PatternLinesProps) {
  const isLineValid = (line: PatternLine) => {
    if (!canPlace || !selectedRuneType) return false;
    // Line must be empty or have same rune type, and not be full
    return (line.runeType === null || line.runeType === selectedRuneType) && line.count < line.tier;
  };
  
  // Debug logging
  console.log('PatternLines props:', { canPlace, selectedRuneType, hasHandler: !!onPlaceRunes });
  
  return (
    <div className="space-y-2">
      {patternLines.map((line, index) => {
        const isValid = isLineValid(line);
        const isClickable = canPlace && onPlaceRunes;
        
        console.log(`Line ${index}:`, { 
          isValid, 
          isClickable, 
          lineType: line.runeType, 
          selectedType: selectedRuneType,
          count: line.count,
          tier: line.tier
        });
        
        return (
          <button
            key={index}
            onClick={() => isValid && onPlaceRunes?.(index)}
            disabled={!isValid || !isClickable}
            className={`
              flex items-center gap-1 w-full
              ${isClickable ? 'cursor-pointer' : 'cursor-default'}
              ${isValid ? 'hover:bg-gray-700/50 ring-2 ring-blue-500/50' : ''}
              ${isClickable && !isValid ? 'opacity-50' : ''}
              p-1 rounded-lg transition-all
              disabled:cursor-not-allowed
            `}
            aria-label={`Pattern line ${index + 1}, tier ${line.tier}, ${line.count} of ${line.tier} filled`}
          >
            {/* Empty slots */}
            {Array(line.tier)
              .fill(null)
              .map((_, slotIndex) => (
                <div
                  key={slotIndex}
                  style={{ width: '40px', height: '40px' }}
                  className="
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
          </button>
        );
      })}
    </div>
  );
}
