/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import type { PatternLine, RuneType, ScoringWall } from '../../../types/game';
import { getWallColumnForRune } from '../../../utils/scoring';
import { RuneCell } from '../../../components/RuneCell';

interface PatternLinesProps {
  patternLines: PatternLine[];
  wall: ScoringWall;
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {patternLines.map((line, index) => {
        const isValid = isLineValid(line, index);
        const isClickable = canPlace && onPlaceRunes;
        const isMobile = window.innerWidth < 768;
        
        return (
          <button
            key={index}
            onClick={() => isValid && onPlaceRunes?.(index)}
            disabled={!isValid || !isClickable}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '2px' : '4px',
              width: '100%',
              cursor: isClickable ? (isValid ? 'pointer' : 'not-allowed') : 'default',
              backgroundColor: isValid ? 'rgba(191, 219, 254, 0.5)' : 'transparent',
              border: 'none',
              opacity: (isClickable && !isValid) ? 0.5 : 1,
              padding: 0,
              borderRadius: isMobile ? '6px' : '8px',
              transition: 'all 0.2s',
              marginBottom: isMobile ? '2px' : '4px'
            }}
            onMouseEnter={(e) => isValid && (e.currentTarget.style.backgroundColor = 'rgba(147, 197, 253, 0.6)')}
            onMouseLeave={(e) => isValid && (e.currentTarget.style.backgroundColor = 'rgba(191, 219, 254, 0.5)')}
            aria-label={`Pattern line ${index + 1}, tier ${line.tier}, ${line.count} of ${line.tier} filled`}
          >
            {/* Pattern line slots */}
            {Array(line.tier)
              .fill(null)
              .map((_, slotIndex) => {
                const rune = slotIndex < line.count && line.runeType ? {
                  id: `pattern-${index}-${slotIndex}`,
                  runeType: line.runeType,
                  effect: { type: 'None' as const }
                } : null;
                
                return (
                  <RuneCell
                    key={slotIndex}
                    rune={rune}
                    variant="pattern"
                    size="large"
                    placeholder={{
                      type: 'text',
                      text: String(line.tier),
                    }}
                    showEffect={false}
                  />
                );
              })}
          </button>
        );
      })}
    </div>
  );
}
