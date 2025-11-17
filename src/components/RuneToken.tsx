/**
 * RuneToken component - displays a single rune
 * Now uses the unified RuneCell component
 */

import type { Rune } from '../types/game';
import { RuneCell } from './RuneCell';

interface RuneTokenProps {
  rune: Rune;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export function RuneToken({ rune, size = 'medium', onClick }: RuneTokenProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'scale(1)')}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
      }}
    >
      <RuneCell
        rune={rune}
        variant="selected"
        size={size}
        showEffect={true}
      />
    </div>
  );
}
