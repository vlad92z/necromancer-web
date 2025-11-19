/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { PatternLine, RuneType, ScoringWall } from '../../../types/game';
import { getWallColumnForRune } from '../../../utils/scoring';
import { RuneCell } from '../../../components/RuneCell';

interface PatternLinesProps {
  patternLines: PatternLine[];
  wall: ScoringWall;
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  frozenLineIndexes?: number[];
  freezeSelectionEnabled?: boolean;
  onFreezeLine?: (patternLineIndex: number) => void;
}

export function PatternLines({
  patternLines,
  wall,
  onPlaceRunes,
  selectedRuneType,
  canPlace,
  frozenLineIndexes = [],
  freezeSelectionEnabled = false,
  onFreezeLine,
}: PatternLinesProps) {
  const isPlacementValid = (line: PatternLine, lineIndex: number) => {
    if (!canPlace || !selectedRuneType) return false;

    if (frozenLineIndexes.includes(lineIndex)) {
      return false;
    }
    
    const matchesType = line.runeType === null || line.runeType === selectedRuneType;
    const notFull = line.count < line.tier;
    
    const row = lineIndex;
    const col = getWallColumnForRune(row, selectedRuneType);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {patternLines.map((line, index) => {
        const isFrozen = frozenLineIndexes.includes(index);
        const canFreezeLine = freezeSelectionEnabled && !isFrozen && line.count < line.tier;
        const isPlacementTarget = isPlacementValid(line, index);
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
        const buttonOpacity = freezeSelectionEnabled
          ? (canFreezeLine ? 1 : 0.4)
          : (buttonDisabled ? 0.5 : 1);

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
              gap: '4px',
              width: '100%',
              cursor: cursorStyle,
              backgroundColor: isFrozen ? 'rgba(191, 219, 254, 0.35)' : 'transparent',
              border: 'none',
              opacity: buttonOpacity,
              padding: 0,
              borderRadius: '8px',
              transition: 'all 0.2s',
              marginBottom: '4px',
              position: 'relative'
            }}
            aria-label={ariaLabel}
          >
            {isFrozen && !freezeSelectionEnabled && (
              <div style={{
                position: 'absolute',
                right: '-24px',
                fontSize: '20px',
                color: '#0ea5e9',
                textShadow: '0 0 6px rgba(125, 211, 252, 0.8)'
              }}>
                ❄️
              </div>
            )}
            {Array(line.tier)
              .fill(null)
              .map((_, slotIndex) => {
                const rune = slotIndex < line.count && line.runeType ? {
                  id: `pattern-${index}-${slotIndex}`,
                  runeType: line.runeType,
                  effect: { type: 'None' as const }
                } : null;
                const cellMotionProps = showGlow
                  ? {
                      animate: { boxShadow: glowRange },
                      transition: cellPulseTransition
                    }
                  : {};
                
                return (
                  <motion.div
                    key={slotIndex}
                    style={{
                      boxShadow: showGlow ? (freezeSelectionEnabled ? freezeGlowRest : selectableGlowRest) : 'none',
                      borderRadius: '8px',
                      transition: 'box-shadow 0.2s'
                    }}
                    {...cellMotionProps}
                  >
                    <RuneCell
                      rune={rune}
                      variant="pattern"
                      size="large"
                      showEffect={false}
                    />
                  </motion.div>
                );
              })}
          </button>
        );
      })}
    </div>
  );
}
