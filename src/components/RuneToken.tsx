/**
 * RuneToken component - displays a single rune
 */

import type { Rune } from '../types/game';
import { getRuneColorClass } from '../utils/runeHelpers';
import fireRune from '../assets/runes/fire_rune.svg';
import frostRune from '../assets/runes/frost_rune.svg';
import poisonRune from '../assets/runes/poison_rune.svg';
import voidRune from '../assets/runes/void_rune.svg';
import windRune from '../assets/runes/wind_rune.svg';

interface RuneTokenProps {
  rune: Rune;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const SIZE_CONFIG = {
  small: { width: 48, height: 48 },
  medium: { width: 64, height: 64 },
  large: { width: 80, height: 80 },
};

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Poison: poisonRune,
  Void: voidRune,
  Wind: windRune,
};

export function RuneToken({ rune, size = 'medium', onClick }: RuneTokenProps) {
  const colorClass = getRuneColorClass(rune.runeType);
  const runeImage = RUNE_ASSETS[rune.runeType];
  const config = SIZE_CONFIG[size];
  
  return (
    <div
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
      }}
      className={`
        ${colorClass} 
        rounded-lg 
        flex 
        items-center 
        justify-center 
        shadow-md 
        p-1
        ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${rune.runeType} rune`}
    >
      <img 
        src={runeImage} 
        alt={`${rune.runeType} rune`}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
