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
    <div style={{ display: 'flex', flexDirection: 'column', gap: window.innerWidth < 768 ? '2px' : '4px' }}>
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
              backgroundColor: isValid ? 'rgba(191, 219, 254, 0.3)' : 'transparent',
              border: '2px solid transparent',
              borderColor: isValid ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
              opacity: (isClickable && !isValid) ? 0.5 : 1,
              padding: 0,
              borderRadius: isMobile ? '6px' : '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => isValid && (e.currentTarget.style.backgroundColor = 'rgba(147, 197, 253, 0.4)')}
            onMouseLeave={(e) => isValid && (e.currentTarget.style.backgroundColor = 'rgba(191, 219, 254, 0.3)')}
            aria-label={`Pattern line ${index + 1}, tier ${line.tier}, ${line.count} of ${line.tier} filled`}
          >
            {/* Empty slots */}
            {Array(line.tier)
              .fill(null)
              .map((_, slotIndex) => (
                <div
                  key={slotIndex}
                  style={{
                    width: isMobile ? '30px' : '60px',
                    height: isMobile ? '30px' : '60px',
                    border: '2px solid #cbd5e1',
                    borderRadius: isMobile ? '3px' : '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  {slotIndex < line.count && line.runeType ? (
                    <img 
                      src={RUNE_ASSETS[line.runeType]} 
                      alt={`${line.runeType} rune`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: isMobile ? '2px' : '4px' }}
                    />
                  ) : (
                    <div style={{fontSize: isMobile ? '14px' : '20px', color: '#64748b'}}>{line.tier}</div>
                  )}
                </div>
              ))}
            <div style={{fontSize: isMobile ? '14px' : '20px'}}>
              {line.count}/{line.tier}
            </div>
          </button>
        );
      })}
    </div>
  );
}
