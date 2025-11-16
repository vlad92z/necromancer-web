/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import type { PatternLine, RuneType, ScoringWall } from '../../../types/game';
import { getWallColumnForRune } from '../../../utils/scoring';
import fireRune from '../../../assets/runes/fire_rune.svg';
import frostRune from '../../../assets/runes/frost_rune.svg';
import poisonRune from '../../../assets/runes/poison_rune.svg';
import voidRune from '../../../assets/runes/void_rune.svg';
import windRune from '../../../assets/runes/wind_rune.svg';

interface PatternLinesProps {
  patternLines: PatternLine[];
  wall: ScoringWall;
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
}

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Poison: poisonRune,
  Void: voidRune,
  Wind: windRune,
};

export function PatternLines({ patternLines, wall, onPlaceRunes, selectedRuneType, canPlace }: PatternLinesProps) {
  const isLineValid = (line: PatternLine, lineIndex: number) => {
    if (!canPlace || !selectedRuneType) return false;
    
    // Line must be empty or have same rune type, and not be full
    const matchesType = line.runeType === null || line.runeType === selectedRuneType;
    const notFull = line.count < line.tier;
    
    // Check if rune type already exists on wall in this row
    const row = lineIndex;
    const col = getWallColumnForRune(row, selectedRuneType);
    const notOnWall = wall[row][col].runeType === null;
    
    return matchesType && notFull && notOnWall;
  };
  
  return (
    <div className="space-y-2">
      {patternLines.map((line, index) => {
        const isValid = isLineValid(line, index);
        const isClickable = canPlace && onPlaceRunes;
        
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
                  style={{ width: '60px', height: '60px' }}
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
                    <img 
                      src={RUNE_ASSETS[line.runeType]} 
                      alt={`${line.runeType} rune`}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div style={{fontSize: '20px'}}>{line.tier}</div>
                  )}
                </div>
              ))}
            <div style={{fontSize: '20px'}}>
              {line.count}/{line.tier}
            </div>
          </button>
        );
      })}
    </div>
  );
}
