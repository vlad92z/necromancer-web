/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { PatternLine, RuneType, ScoringWall } from '../../../../types/game';
import { getWallColumnForRune } from '../../../../utils/scoring';
import { RuneCell } from '../../../../components/RuneCell';
import { copyRuneEffects, getRuneEffectsForType } from '../../../../utils/runeEffects';

interface PatternLinesProps {
  patternLines: PatternLine[];
  wall: ScoringWall;
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  frozenLineIndexes?: number[];
  lockedLineIndexes?: number[];
  freezeSelectionEnabled?: boolean;
  onFreezeLine?: (patternLineIndex: number) => void;
  playerId?: string;
  hiddenSlotKeys?: Set<string>;
}

export function PatternLines({
  patternLines,
  wall,
  onPlaceRunes,
  selectedRuneType,
  canPlace,
  frozenLineIndexes = [],
  lockedLineIndexes = [],
  freezeSelectionEnabled = false,
  onFreezeLine,
  playerId,
  hiddenSlotKeys,
}: PatternLinesProps) {
  const isPlacementValid = (line: PatternLine, lineIndex: number) => {
    if (!canPlace || !selectedRuneType) return false;

    if (frozenLineIndexes.includes(lineIndex)) {
      return false;
    }
    
    const matchesType = line.runeType === null || line.runeType === selectedRuneType;
    const notFull = line.count < line.tier;
    
    const row = lineIndex;
    const wallSize = wall.length;
    const col = getWallColumnForRune(row, selectedRuneType, wallSize);
    const notOnWall = wall[row][col].runeType === null;
    
    return matchesType && notFull && notOnWall;
  };

  const selectableGlowRest = '0 0 18px rgba(34, 197, 94, 0.75), 0 0 38px rgba(34, 197, 94, 0.35)';
  const selectableGlowPeak = '0 0 28px rgba(16, 185, 129, 0.95), 0 0 56px rgba(21, 128, 61, 0.55)';
  const selectableGlowRange: [string, string] = [selectableGlowRest, selectableGlowPeak];
  const freezeGlowRest = '0 0 18px rgba(6, 182, 212, 0.85), 0 0 32px rgba(14, 165, 233, 0.45)';
  const freezeGlowPeak = '0 0 26px rgba(14, 165, 233, 0.95), 0 0 52px rgba(125, 211, 252, 0.55)';
  const freezeGlowRange: [string, string] = [freezeGlowRest, freezeGlowPeak];
  const cellPulseTransition: Transition = {
    duration: 1.2,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-end' }}>
      {patternLines.map((line, index) => {
        const isFrozen = frozenLineIndexes.includes(index);
        const isLocked = lockedLineIndexes.includes(index);
        const canFreezeLine = freezeSelectionEnabled && !isFrozen && line.count < line.tier;
        const isPlacementTarget = !isLocked && isPlacementValid(line, index);
        const placementClickable = Boolean(canPlace && onPlaceRunes);
        const freezeClickable = freezeSelectionEnabled && Boolean(onFreezeLine);
        const showGlow = freezeSelectionEnabled ? canFreezeLine : isPlacementTarget;
        const glowRange = freezeSelectionEnabled ? freezeGlowRange : selectableGlowRange;
        const buttonDisabled = freezeSelectionEnabled
          ? !(canFreezeLine && freezeClickable)
          : !(isPlacementTarget && placementClickable);
        const cursorStyle = freezeSelectionEnabled
          ? (canFreezeLine ? 'pointer' : 'not-allowed')
          : placementClickable
            ? (isPlacementTarget ? 'pointer' : 'not-allowed')
            : 'default';

        const ariaLabelBase = `Pattern line ${index + 1}, tier ${line.tier}, ${line.count} of ${line.tier} filled`;
        const ariaLabel = freezeSelectionEnabled
          ? `${ariaLabelBase}. ${canFreezeLine ? 'Click to freeze this line.' : 'Cannot freeze this line.'}`
          : ariaLabelBase;

        return (
          <button
            key={index}
            onClick={() => {
              if (freezeSelectionEnabled) {
                if (canFreezeLine && onFreezeLine) {
                  onFreezeLine(index);
                }
              } else if (isPlacementTarget && onPlaceRunes) {
                onPlaceRunes(index);
              }
            }}
            disabled={buttonDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px',
              width: '100%',
              cursor: cursorStyle,
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
              borderRadius: '8px',
              transition: 'all 0.2s',
              marginBottom: '4px',
              position: 'relative',
              opacity: isLocked ? 0.15 : 1,
            }}
            aria-label={ariaLabel}
          >
            {Array(line.tier)
              .fill(null)
              .map((_, slotIndex) => {
                const slotKey = `${index}-${slotIndex}`;
                const shouldHideRune = hiddenSlotKeys?.has(slotKey);
                const hasRuneInSlot = slotIndex < line.count && line.runeType !== null;
                // Primary rune (moves to the wall) should live in the trailing cell
                const isPrimaryRuneSlot = slotIndex === line.tier - 1 && !shouldHideRune;
                const runeEffects = isPrimaryRuneSlot && line.runeType
                  ? copyRuneEffects(line.firstRuneEffects ?? getRuneEffectsForType(line.runeType))
                  : { passive: [], active: [] };
                const rune = hasRuneInSlot && line.runeType ? {
                  id: `pattern-${index}-${slotIndex}`,
                  runeType: line.runeType,
                  effects: runeEffects,
                } : null;
                const displayedRune = shouldHideRune ? null : rune;
                const showFrozenOverlay = isFrozen && !freezeSelectionEnabled;
                const cellMotionProps = showGlow
                  ? {
                      animate: { boxShadow: glowRange },
                      transition: cellPulseTransition
                    }
                  : {};
                
                return (
                  <motion.div
                    key={slotIndex}
                    data-player-id={playerId}
                    data-pattern-line-index={index}
                    data-pattern-slot-index={slotIndex}
                    style={{
                      position: 'relative',
                      boxShadow: showGlow ? (freezeSelectionEnabled ? freezeGlowRest : selectableGlowRest) : 'none',
                      borderRadius: '8px',
                      transition: 'box-shadow 0.2s'
                    }}
                    {...cellMotionProps}
                  >
                    <RuneCell
                      rune={displayedRune}
                      variant="pattern"
                      size="large"
                      showEffect={false}
                    />
                    {isPrimaryRuneSlot && !isLocked && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-1px',
                          borderRadius: '12px',
                          border: '1px solid rgba(192, 132, 252, 0.8)',
                          boxShadow: '0 0 18px rgba(192, 132, 252, 0.55)',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                    {showFrozenOverlay && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          color: '#0ea5e9',
                          textShadow: '0 0 6px rgba(125, 211, 252, 0.8)',
                          pointerEvents: 'none'
                        }}
                      >
                        ❄️
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </button>
        );
      })}
    </div>
  );
}
