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
  return (
    <div style={{ marginTop: window.innerWidth < 768 ? '0px' : '16px' }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onPlaceRunesInFloor}
        disabled={!canPlace || !onPlaceRunesInFloor}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: window.innerWidth < 768 ? '2px' : '8px',
          width: '100%',
          cursor: (canPlace && onPlaceRunesInFloor) ? 'pointer' : 'default',
          backgroundColor: (canPlace && onPlaceRunesInFloor) ? 'rgba(254, 202, 202, 0.5)' : 'transparent',
          border: 'none',
          padding: window.innerWidth < 768 ? '4px' : '8px',
          borderRadius: window.innerWidth < 768 ? '6px' : '8px',
          transition: 'all 0.2s',
          justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start'
        }}
        onMouseEnter={(e) => (canPlace && onPlaceRunesInFloor) && (e.currentTarget.style.backgroundColor = 'rgba(254, 202, 202, 0.7)')}
        onMouseLeave={(e) => (canPlace && onPlaceRunesInFloor) && (e.currentTarget.style.backgroundColor = 'rgba(254, 202, 202, 0.5)')}
        aria-label="Place runes in floor line (take penalties)"
      >
        {Array(floorLine.maxCapacity)
          .fill(null)
          .map((_, index) => (
            <RuneCell
              key={index}
              rune={floorLine.runes[index] || null}
              variant="floor"
              size="large"
              placeholder={{
                type: 'text',
                text: `-${index + 1}`,
              }}
              showEffect={false}
            />
          ))}
      </button>
    </div>
  );
}
