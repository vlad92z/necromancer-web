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
  
  return (
    <div
      style={{ width: '60px', height: '60px' }}
      className="
        border-2 
        border-gray-600 
        rounded-lg 
        flex 
        items-center 
        justify-center 
        bg-gray-800
        p-1
      "
    >
      {cell.runeType ? (
        <img 
          src={runeImage} 
          alt={`${cell.runeType} rune`}
          className="w-full h-full object-contain"
        />
      ) : (
        <img 
          src={runeImage} 
          alt={`${expectedRuneType} placeholder`}
          className="w-full h-full object-contain opacity-30"
        />
      )}
    </div>
  );
}
