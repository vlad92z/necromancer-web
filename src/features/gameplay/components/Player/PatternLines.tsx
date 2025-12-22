/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import type { PatternLine, Rune, RuneType, ScoringWall } from '../../../../types/game';
import { getWallColumnForRune } from '../../../../utils/scoring';
import { RuneCell } from '../../../../components/RuneCell';
import { copyRuneEffects, getRuneEffectsForType } from '../../../../utils/runeEffects';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { buildPatternLineExistingTooltipCards, buildPatternLinePlacementTooltipCards } from '../../../../utils/tooltipCards';
import { use } from 'react';

interface PatternLinesProps {
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  playerId?: string;
  hiddenSlotKeys?: Set<string>;
  selectedRunes: Rune[];
  strain: number;
  activePatternLineIndex?: number | null;
}

export function PatternLines({
  onPlaceRunes,
  selectedRuneType,
  canPlace,
  playerId,
  hiddenSlotKeys,
  selectedRunes,
  strain,
  activePatternLineIndex,
}: PatternLinesProps) {
  const patternLines = useGameplayStore((state) => state.player.patternLines);
  const wall = useGameplayStore((state) => state.player.wall);
  const lockedLines = useGameplayStore((state) => state.lockedPatternLines);

  const isPlacementValid = (line: PatternLine, lineIndex: number) => {
    if (!canPlace || !selectedRuneType) return false;

    const matchesType = line.runeType === null || line.runeType === selectedRuneType;
    const notFull = line.count < line.tier;

    const row = lineIndex;
    const col = getWallColumnForRune(row, selectedRuneType, wall.length);
    const notOnWall = wall[row][col].runeType === null;

    return matchesType && notFull && notOnWall;
  };


  const cellPulseTransition: Transition = {
    duration: 1.2,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut' as const
  };

  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);

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
    <div className="flex w-full flex-col items-start gap-0">
    
      {patternLines.map((line, index) => {
        const isKeyboardActive = activePatternLineIndex === index;
        const hasActiveElement = activePatternLineIndex !== null;
        const keyboardGlowRest = '0 0 18px rgba(125, 211, 252, 0.75), 0 0 38px rgba(125, 211, 252, 0.35)';
        const keyboardGlowPeak = '0 0 28px  rgba(125, 211, 252, 0.95), 0 0 56px rgba(125, 211, 252, 0.55)';
        const selectableGlowRest = hasActiveElement ? 'none' : keyboardGlowRest;
        const selectableGlowPeak = hasActiveElement ? 'none' : keyboardGlowPeak;
        const glowRange: [string, string] = [selectableGlowRest, selectableGlowPeak];
        const isLocked = lockedLines.includes(index);
        const isPlacementTarget = !isLocked && isPlacementValid(line, index);
        
        const placementClickable = Boolean(canPlace && onPlaceRunes);
        const showGlow = isPlacementTarget;
        const buttonDisabled = !(isPlacementTarget && placementClickable);
        const cursorStyle = placementClickable
          ? (isPlacementTarget ? 'pointer' : 'not-allowed')
          : 'default';
        const keyboardGlowRange: [string, string] = [keyboardGlowRest, keyboardGlowPeak];
        const keyboardBoxShadow = isKeyboardActive ? keyboardGlowRest : 'none';
        const keyboardBackground = isKeyboardActive ? 'rgba(9, 22, 38, 0.75)' : 'transparent';

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
            onPointerEnter={() => handleTooltipEnter(line, isPlacementTarget)}
            onPointerLeave={resetTooltipCards}
            onFocus={() => handleTooltipEnter(line, isPlacementTarget)}
            onBlur={resetTooltipCards}
            disabled={buttonDisabled}
            className="relative mb-1 flex w-full items-start justify-start gap-0 rounded-lg border-0 bg-transparent p-0 shadow-none transition-all duration-200"
            style={{
              cursor: cursorStyle,
              opacity: isLocked ? 0.15 : 1,
            }}
            data-active={isKeyboardActive ? 'true' : undefined}
            aria-label={ariaLabel}
          >
            <motion.div
              className="inline-flex items-center gap-1 rounded-lg p-0 transition-all duration-200"
              style={{
                backgroundColor: keyboardBackground,
                boxShadow: keyboardBoxShadow,
              }}
              animate={isKeyboardActive ? { boxShadow: keyboardGlowRange } : undefined}
              transition={isKeyboardActive ? cellPulseTransition : undefined}
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
                      className="relative rounded-lg transition-[box-shadow] duration-200"
                      style={{
                        boxShadow: showGlow ? selectableGlowRest : 'none',
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
                          className="pointer-events-none absolute -inset-px rounded-xl"
                          style={{
                            border: '1px solid rgba(192, 132, 252, 0.8)',
                            boxShadow: '0 0 18px rgba(192, 132, 252, 0.55)',
                          }}
                        />
                      )}
                      {slotIndex > 0 && (
                        <div
                          className="pointer-events-none absolute inset-3 z-[2] rounded-[25px] opacity-70"
                          style={{
                            backgroundImage: `linear-gradient(45deg, transparent 46%, ${craftingCellLineColor} 46%, ${craftingCellLineColor} 54%, transparent 54%)`,
                          }}
                        />
                      )}
                    </motion.div>
                  );
                })}
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}
