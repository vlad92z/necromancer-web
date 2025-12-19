/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import type { PatternLine } from '../../../../types/game';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { buildPatternLineExistingTooltipCards, buildPatternLinePlacementTooltipCards } from '../../../../utils/tooltipCards';
import { getColumn } from '../../../../utils/runeHelpers';
import { RUNE_SIZE_CONFIG } from '../../../../styles/tokens';

interface PatternLinesProps {
  onPlaceRunes: (patternLineIndex: number) => void;
  canPlace?: boolean;
  activePatternLineIndex?: number | null;
}

export function PatternLines({
  onPlaceRunes,
  canPlace,
  activePatternLineIndex,
}: PatternLinesProps) {
  const wall = useGameplayStore((state) => state.player.wall);
  const patternLiners = useGameplayStore((state) => state.player.patternLines);
  const selectedRunes = useGameplayStore((state) => state.selectedRunes);
  const playerId = useGameplayStore((state) => state.player.id);
  const lockedLineIndexes = useGameplayStore((state) => state.lockedPatternLines);
  const placeRunes = useGameplayStore((state) => state.placeRunes);
  const overloadDamage = 5;//useGameplayStore((state) => state);

  const isPlacementValid = (line: PatternLine, lineIndex: number) => {
    if (!canPlace || !selectedRunes[0]?.runeType) return false;

    const lineRunes = line.runes
    const lineRunesCount = lineRunes.length;
    const matchesType = lineRunesCount === 0 || lineRunes[0].runeType === selectedRunes[0].runeType;
    const notFull = lineRunesCount < line.tier;

    const row = lineIndex;
    const col = getColumn(row, selectedRunes[0].runeType);
    const notOnWall = wall[row][col].rune === null;

    return matchesType && notFull && notOnWall;
  };

  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);

  const handleTooltipEnter = (line: PatternLine, isPlacementTarget: boolean) => {
    if (!selectedRunes || selectedRunes.length > 0) {
      if (!isPlacementTarget) {
        return;
      }
      const lineRunesCount = line.runes.length;
      const tooltipCards = buildPatternLinePlacementTooltipCards({
        selectedRunes,
        patternLineTier: line.tier,
        patternLineCount: lineRunesCount,
        overloadDamage,
      });
      if (tooltipCards.length > 0) {
        setTooltipCards(tooltipCards, true);
      }
      return;
    }

    if (line.runes.length > 0) {
      const tooltipCards = buildPatternLineExistingTooltipCards(line);
      if (tooltipCards.length > 0) {
        setTooltipCards(tooltipCards);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start', width: '100%' }}>
      {patternLiners.map((line, index) => {
        const isKeyboardActive = activePatternLineIndex === index;
        const hasActiveElement = activePatternLineIndex !== null;
        const keyboardGlowRest = '0 0 18px rgba(125, 211, 252, 0.75), 0 0 38px rgba(125, 211, 252, 0.35)';
        const keyboardGlowPeak = '0 0 28px  rgba(125, 211, 252, 0.95), 0 0 56px rgba(125, 211, 252, 0.55)';
        const isLocked = lockedLineIndexes.includes(index);
        const isPlacementTarget = !isLocked && isPlacementValid(line, index);

        const placementClickable = Boolean(canPlace && onPlaceRunes);
        const cursorStyle = placementClickable
          ? (isPlacementTarget ? 'pointer' : 'not-allowed')
          : 'default';
        const imageDimension = RUNE_SIZE_CONFIG['large'].dimension;
        return (
          <button
            key={index}
            onClick={() => {
              console.log('Pattern line clicked', { index, isPlacementTarget, line });
              // if (isPlacementTarget && onPlaceRunes) {
              placeRunes(index);
              // }
              // onPlaceRunes(index);
              // }
            }}
            onPointerEnter={() => handleTooltipEnter(line, isPlacementTarget)}
            onPointerLeave={resetTooltipCards}
            onFocus={() => handleTooltipEnter(line, isPlacementTarget)}
            onBlur={resetTooltipCards}
            disabled={false}
            className='flex flex-row gap-1'
            // style={{
            //   display: 'flex',
            //   alignItems: 'flex-start',
            //   justifyContent: 'flex-start',
            //   gap: 0,
            //   width: '100%',
            //   cursor: cursorStyle,
            //   border: 'none',
            //   padding: 0,
            //   borderRadius: '8px',
            //   transition: 'all 0.2s',
            //   marginBottom: '4px',
            //   position: 'relative',
            //   opacity: isLocked ? 0.15 : 1,
            //   backgroundColor: 'transparent',
            //   boxShadow: 'none',
            // }}
            data-active={isKeyboardActive ? 'true' : undefined}
          >
            {Array(line.tier)
              .fill(null)
              .map((_, slotIndex) => {
                return (
                  <div
                    className={`border rounded-xl border-slate-500/50 align-center p-1 ${slotIndex > 0 ? '' : 'bg-sky-900/20'}`}
                    style={{ width: imageDimension, height: imageDimension }}>
                  </div>
                );
              })}
          </button>
        );
      })}
    </div>
  );
}
