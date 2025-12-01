/**
 * FloorLine component - displays the floor line (penalty area)
 */

import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { FloorLine as FloorLineType } from '../../../../types/game';
import { RuneCell } from '../../../../components/RuneCell';
import overloadSvg from '../../../../assets/stats/overload.svg';

interface FloorLineProps {
  floorLine: FloorLineType;
  onPlaceRunesInFloor?: () => void;
  canPlace?: boolean;
  /**
   * Number of floor slots to visually neutralize (render with standard/pattern-like background).
   * This should come from any FloorPenaltyMitigation effects secured on the scoring wall (pending placements included).
   */
  mitigatedSlots?: number;
  playerId?: string;
  hiddenSlotIndexes?: Set<number>;
}

export function FloorLine({ floorLine, onPlaceRunesInFloor, canPlace, mitigatedSlots = 0, playerId, hiddenSlotIndexes }: FloorLineProps) {
  const isSelectable = Boolean(canPlace && onPlaceRunesInFloor);
  const selectableGlowRest = '0 0 20px rgba(248, 113, 113, 0.75), 0 0 40px rgba(239, 68, 68, 0.45)';
  const selectableGlowPeak = '0 0 32px rgba(239, 68, 68, 0.95), 0 0 60px rgba(185, 28, 28, 0.55)';
  const selectableGlowRange: [string, string] = [selectableGlowRest, selectableGlowPeak];

  const cellPulseTransition: Transition = {
    duration: 1.2,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
    >
      <button
        onClick={onPlaceRunesInFloor}
        disabled={!isSelectable}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '4px 6px',
          cursor: isSelectable ? 'pointer' : 'default',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: '10px',
          transition: 'all 0.2s',
          width: '100%',
          maxWidth: '680px'
        }}
        aria-label="Place runes in floor line (take penalties)"
      >
        {Array(floorLine.maxCapacity)
          .fill(null)
          .map((_, index) => {
            const isNeutral = index < mitigatedSlots;
            const isHidden = hiddenSlotIndexes?.has(index);
            const cellCanGlow = isSelectable && !isNeutral;
            const cellMotionProps = cellCanGlow
              ? {
                  animate: { boxShadow: selectableGlowRange },
                  transition: cellPulseTransition
                }
              : {};
            const runeToDisplay = isHidden ? null : (floorLine.runes[index] || null);
            return (
              <motion.div
                key={index}
                data-player-id={playerId}
                data-floor-slot-index={index}
                style={{
                  boxShadow: cellCanGlow ? selectableGlowRest : 'none',
                  borderRadius: '8px',
                  transition: 'box-shadow 0.2s'
                }}
                {...cellMotionProps}
              >
                <RuneCell
                  rune={runeToDisplay}
                  variant="floor"
                    forceVariant={isNeutral ? 'pattern' : undefined}
                    emptyIcon={!runeToDisplay && !isNeutral && !isHidden ? overloadSvg : undefined}
                  size="large"
                  showEffect={false}
                />
              </motion.div>
            );
          })}
      </button>
    </div>
  );
}
