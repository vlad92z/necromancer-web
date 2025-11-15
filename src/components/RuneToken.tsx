/**
 * RuneToken component - displays a single rune
 */

import type { Rune } from '../types/game';
import { getRuneGlyph, getRuneColorClass } from '../utils/runeHelpers';

interface RuneTokenProps {
  rune: Rune;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const SIZE_CLASSES = {
  small: 'w-8 h-8 text-xs',
  medium: 'w-12 h-12 text-base',
  large: 'w-16 h-16 text-lg',
};

export function RuneToken({ rune, size = 'medium', onClick }: RuneTokenProps) {
  const colorClass = getRuneColorClass(rune.runeType);
  const glyph = getRuneGlyph(rune.runeType);
  const sizeClass = SIZE_CLASSES[size];
  
  return (
    <div
      className={`
        ${colorClass} 
        ${sizeClass} 
        rounded-lg 
        flex 
        items-center 
        justify-center 
        text-white 
        font-bold 
        shadow-md 
        ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${rune.runeType} rune`}
    >
      {glyph}
    </div>
  );
}
