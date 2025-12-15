/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { PatternLine, Rune, RuneType, ScoringWall } from '../../../../types/game';
import { RuneCell } from '../../../../components/RuneCell';
import { copyRuneEffects, getRuneEffectsForType } from '../../../../utils/runeEffects';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { buildPatternLineExistingTooltipCards, buildPatternLinePlacementTooltipCards } from '../../../../utils/tooltipCards';
import { isPatternLinePlacementValid } from '../../../../utils/patternLineHelpers';

interface PatternLinesProps {
  patternLines: PatternLine[];
  wall: ScoringWall;
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  lockedLineIndexes?: number[];
  playerId?: string;
  hiddenSlotKeys?: Set<string>;
  selectedRunes: Rune[];
  strain: number;
}

export function PatternLines({
  patternLines,
  wall,
  onPlaceRunes,
  selectedRuneType,
  canPlace,
  lockedLineIndexes = [],
  playerId,
  hiddenSlotKeys,
  selectedRunes,
  strain,
}: PatternLinesProps) {
  const selectableGlowRest = '0 0 18px rgba(34, 197, 94, 0.75), 0 0 38px rgba(34, 197, 94, 0.35)';
  const selectableGlowPeak = '0 0 28px rgba(16, 185, 129, 0.95), 0 0 56px rgba(21, 128, 61, 0.55)';
  const selectableGlowRange: [string, string] = [selectableGlowRest, selectableGlowPeak];
  const cellPulseTransition: Transition = {
    duration: 1.2,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const
  };
  // Shared spacing value (pixels) used for both vertical and horizontal gaps
  const LINE_GAP = 5;
  
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const setActiveElement = useGameplayStore((state) => state.setActiveElement);
  const resetActiveElement = useGameplayStore((state) => state.resetActiveElement);
  const activeElement = useGameplayStore((state) => state.activeElement);

  const handleTooltipEnter = (line: PatternLine, isPlacementTarget: boolean) => {
    if (selectedRunes.length > 0) {
      if (!isPlacementTarget) {
        return;
      }
      const tooltipCards = buildPatternLinePlacementTooltipCards({
        selectedRunes,
        patternLineTier: line.tier,
        patternLineCount: line.count,
        strain,
      });
      if (tooltipCards.length > 0) {
        setTooltipCards(tooltipCards, true);
      }
      return;
    }

    if (line.runeType && line.count > 0) {
      const tooltipCards = buildPatternLineExistingTooltipCards(line);
      if (tooltipCards.length > 0) {
        setTooltipCards(tooltipCards);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: LINE_GAP, alignItems: 'flex-start', width: '100%' }}>
      {patternLines.map((line, index) => {
        const isLocked = lockedLineIndexes.includes(index);
        const isPlacementTarget = !isLocked && canPlace && isPatternLinePlacementValid(line, index, selectedRuneType ?? null, wall, lockedLineIndexes);
        const placementClickable = Boolean(canPlace && onPlaceRunes);
        const showGlow = isPlacementTarget;
        const glowRange = selectableGlowRange;
        const buttonDisabled = !(isPlacementTarget && placementClickable);
        const cursorStyle = placementClickable
            ? (isPlacementTarget ? 'pointer' : 'not-allowed')
            : 'default';
        const isActiveLine = activeElement?.type === 'pattern-line' && activeElement.lineIndex === index;

        const ariaLabelBase = `Pattern line ${index + 1}, tier ${line.tier}, ${line.count} of ${line.tier} filled`;
        const ariaLabel = ariaLabelBase;

        const craftingCellLineColor = "rgba(70, 40, 100)";
        return (
        <button
            key={index}
            onClick={() => {
              if (isPlacementTarget && onPlaceRunes) {
                onPlaceRunes(index);
              }
            }}
            onPointerEnter={() => {
              setActiveElement({ type: 'pattern-line', lineIndex: index });
              handleTooltipEnter(line, isPlacementTarget);
            }}
            onPointerLeave={() => {
              resetTooltipCards();
              resetActiveElement();
            }}
            onFocus={() => {
              setActiveElement({ type: 'pattern-line', lineIndex: index });
              handleTooltipEnter(line, isPlacementTarget);
            }}
            onBlur={() => {
              resetTooltipCards();
              resetActiveElement();
            }}
            disabled={buttonDisabled}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: LINE_GAP,
              width: '100%',
              cursor: cursorStyle,
              backgroundColor: 'transparent',
              border: 'none',
              padding: 0,
              borderRadius: '8px',
              transition: 'all 0.2s',
              position: 'relative',
              opacity: isLocked ? 0.15 : 1,
              boxShadow: isActiveLine
                ? '0 0 0 2px rgba(125, 211, 252, 0.8), 0 0 16px rgba(56, 189, 248, 0.35)'
                : 'none',
            }}
            aria-label={ariaLabel}
          >
            {Array(line.tier)
              .fill(null)
              .map((_, slotIndex) => {
                const slotKey = `${index}-${slotIndex}`;
                const shouldHideRune = hiddenSlotKeys?.has(slotKey);
                const hasRuneInSlot = slotIndex < line.count && line.runeType !== null;
                // Primary rune (moves to the wall) should live in the leading cell
                const isPrimaryRuneSlot = slotIndex === 0 && !shouldHideRune;
                const runeEffects = isPrimaryRuneSlot && line.runeType
                  ? copyRuneEffects(line.firstRuneEffects ?? getRuneEffectsForType(line.runeType))
                  : [];
                const rune = hasRuneInSlot && line.runeType ? {
                  id: `pattern-${index}-${slotIndex}`,
                  runeType: line.runeType,
                  effects: runeEffects,
                } : null;
                const displayedRune = shouldHideRune ? null : rune;
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
                      boxShadow: showGlow ? selectableGlowRest : 'none',
                      borderRadius: '8px',
                      transition: 'box-shadow 0.2s',
                      gap: LINE_GAP
                    }}
                    {...cellMotionProps}
                  >
                    <RuneCell
                      rune={displayedRune}
                      variant="pattern"
                      size="large"
                      showEffect
                      showTooltip
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
                    {slotIndex > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: '12px',
                          pointerEvents: 'none',
                          zIndex: 2,
                          borderRadius: '25px',
                          backgroundImage: `linear-gradient(45deg, transparent 46%, ${craftingCellLineColor} 46%, ${craftingCellLineColor} 54%, transparent 54%)`,
                          opacity: 0.7,
                        }}
                      />
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
