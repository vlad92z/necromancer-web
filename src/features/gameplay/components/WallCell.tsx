/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { WallCell as WallCellType, RuneType } from '../../../types/game';
import fireRune from '../../../assets/runes/fire_rune.svg';
import frostRune from '../../../assets/runes/frost_rune.svg';
import poisonRune from '../../../assets/runes/poison_rune.svg';
import voidRune from '../../../assets/runes/void_rune.svg';
import windRune from '../../../assets/runes/wind_rune.svg';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
}

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Poison: poisonRune,
  Void: voidRune,
  Wind: windRune,
};

// Calculate which rune type belongs in this cell based on Azul pattern
function getExpectedRuneType(row: number, col: number): RuneType {
  const runeTypes: RuneType[] = ['Fire', 'Frost', 'Poison', 'Void', 'Wind'];
  // Reverse the rotation: subtract row from col to find the base index
  const baseIndex = (col - row + 5) % 5;
  return runeTypes[baseIndex];
}

export function WallCell({ cell, row, col }: WallCellProps) {
  const expectedRuneType = getExpectedRuneType(row, col);
  const runeImage = RUNE_ASSETS[cell.runeType || expectedRuneType];
  const isMobile = window.innerWidth < 768;
  
  return (
    <div
      style={{
        width: isMobile ? '30px' : '60px',
        height: isMobile ? '30px' : '60px',
        border: '2px solid #4b5563',
        borderRadius: isMobile ? '6px' : '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1f2937',
        padding: isMobile ? '2px' : '4px'
      }}
    >
      {cell.runeType ? (
        <img 
          src={runeImage} 
          alt={`${cell.runeType} rune`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : (
        <img 
          src={runeImage} 
          alt={`${expectedRuneType} placeholder`}
          style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.3 }}
        />
      )}
    </div>
  );
}
