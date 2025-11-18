/**
 * FloorLine component - displays the floor line (penalty area)
 */

import type { FloorLine as FloorLineType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface FloorLineProps {
  floorLine: FloorLineType;
  onPlaceRunesInFloor?: () => void;
  canPlace?: boolean;
}

export function FloorLine({ floorLine, onPlaceRunesInFloor, canPlace }: FloorLineProps) {
  const isSelectable = Boolean(canPlace && onPlaceRunesInFloor);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onPlaceRunesInFloor}
        disabled={!isSelectable}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gap: '4px',
          cursor: isSelectable ? 'pointer' : 'default',
          backgroundColor: 'transparent',
          border: 'none',
          padding: '8px',
          borderRadius: '8px',
          transition: 'all 0.2s'
        }}
        aria-label="Place runes in floor line (take penalties)"
      >
        {Array(floorLine.maxCapacity)
          .fill(null)
          .map((_, index) => (
            <div
              key={index}
              style={{
                boxShadow: isSelectable ? '0 0 16px rgba(239, 68, 68, 0.8)' : 'none',
                borderRadius: '8px',
                transition: 'box-shadow 0.2s'
              }}
            >
              <RuneCell
                rune={floorLine.runes[index] || null}
                variant="floor"
                size="large"
                showEffect={false}
              />
            </div>
          ))}
      </button>
    </div>
  );
}
