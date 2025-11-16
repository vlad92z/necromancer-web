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
  small: { width: 20, height: 20 },
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
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '4px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        backgroundColor: colorClass === 'bg-red-600' ? '#dc2626' :
                        colorClass === 'bg-blue-600' ? '#2563eb' :
                        colorClass === 'bg-green-600' ? '#16a34a' :
                        colorClass === 'bg-purple-600' ? '#9333ea' :
                        colorClass === 'bg-yellow-600' ? '#ca8a04' : '#6b7280'
      }}
      onClick={onClick}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'scale(1)')}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${rune.runeType} rune`}
    >
      <img 
        src={runeImage} 
        alt={`${rune.runeType} rune`}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}
