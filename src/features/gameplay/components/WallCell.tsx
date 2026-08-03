/**
 * WallCell component - displays a single cell in the scoring wall
 */

import type { Rune, WallCell as WallCellType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import slotRune from '../../../assets/runes/slot_rune.png';
import { wallCellToRune } from '../../../utils/wallCellRune';
import type { RuneSize } from '../../../styles/tokens';

interface WallCellProps {
  cell: WallCellType;
  row: number;
  col: number;
  pulseKey?: number;
  size?: RuneSize;
  onRuneHover?: (rune: Rune) => void;
  onRuneLeave?: () => void;
  isTargetable?: boolean;
}

export function WallCell({
  cell,
  row,
  col,
  pulseKey,
  size = 'large',
  onRuneHover,
  onRuneLeave,
  isTargetable = false,
}: WallCellProps) {
  const rune = wallCellToRune(cell, row, col);
  
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        outline: isTargetable ? '4px solid var(--pixel-focus)' : 'none',
        outlineOffset: isTargetable ? '-4px' : 0,
        filter: isTargetable ? 'brightness(1.18)' : undefined,
      }}
      aria-label={rune
        ? `${rune.name} rune${cell.shield !== null ? `, shield ${cell.shield}` : ''}`
        : 'Empty rune cell'}
      onMouseEnter={() => rune && onRuneHover?.(rune)}
      onMouseLeave={onRuneLeave}
    >
      <RuneCell
        rune={rune}
        variant="wall"
        size={size}
        emptyIcon={slotRune}
        placeholder={{
          type: 'rune',
        }}
        runePulseKey={pulseKey}
      />
      {rune && cell.shield !== null && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border-2 border-[#141313] bg-[#fff8d8] px-1.5 py-0.5 font-['Silkscreen'] text-[11px] leading-none text-[#141313] shadow-[2px_2px_0_#141313]"
        >
          {cell.shield}
        </span>
      )}
    </div>
  );
}
