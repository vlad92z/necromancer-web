/**
 * RuneToken component - displays a single rune
 * Now uses the unified RuneCell component with design tokens
 */

import type { Rune } from '../types/game';
import { RuneCell } from './RuneCell';
import { TRANSITIONS } from '../styles/tokens';

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
        transition: `transform ${TRANSITIONS.medium}`,
      }}
    >
      <RuneCell
        rune={rune}
        variant="selected"
        size={size}
        showEffect
      />
    </div>
  );
}
