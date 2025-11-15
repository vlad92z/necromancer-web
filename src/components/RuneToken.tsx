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

const SIZE_CONFIG = {
  small: { width: 48, height: 48, fontSize: 28 },
  medium: { width: 64, height: 64, fontSize: 36 },
  large: { width: 80, height: 80, fontSize: 48 },
};

export function RuneToken({ rune, size = 'medium', onClick }: RuneTokenProps) {
  const colorClass = getRuneColorClass(rune.runeType);
  const glyph = getRuneGlyph(rune.runeType);
  const config = SIZE_CONFIG[size];
  
  return (
    <div
      className={`
        ${colorClass} 
        rounded-lg 
        flex 
        items-center 
        justify-center 
        text-white 
        font-bold 
        shadow-md 
        ${onClick ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
      `}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        fontSize: `${config.fontSize}px`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${rune.runeType} rune`}
    >
      {glyph}
    </div>
  );
}
