/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import type { PatternLine } from '../../../../types/game';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { getColumn } from '../../../../utils/runeHelpers';
import { RUNE_SIZE_CONFIG } from '../../../../styles/tokens';
import { useSoloGameStore } from '../../../../state/stores/soloGameStore';
import { useSelectionStore } from '../../../../state/stores';

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
  const wall = useSoloGameStore((state) => state.spellWall);
  const patternLines = useSoloGameStore((state) => state.patternLines);
  const selectedRunes = useSelectionStore((state) => state.selectedCards);
  const placeRunes = useGameplayStore((state) => state.placeRunes);
  const overloadDamage = useSoloGameStore((state) => state.overloadDamage);

  const isPlacementValid = (line: PatternLine, lineIndex: number) => {
    if (!canPlace || !selectedRunes[0]?.runeType) return false;

    const lineRunes = line.runes
    const lineRunesCount = lineRunes.length;
    const matchesType = lineRunesCount === 0 || lineRunes[0].runeType === selectedRunes[0].runeType;
    const notFull = lineRunesCount < line.capacity;

    const row = lineIndex;
    const col = getColumn(row, selectedRunes[0].runeType);
    const notOnWall = wall[row][col].rune === null;

    return matchesType && notFull && notOnWall;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start', width: '100%' }}>
      {patternLines.map((line, index) => {
        const isKeyboardActive = activePatternLineIndex === index;
        const hasActiveElement = activePatternLineIndex !== null;
        const keyboardGlowRest = '0 0 18px rgba(125, 211, 252, 0.75), 0 0 38px rgba(125, 211, 252, 0.35)';
        const keyboardGlowPeak = '0 0 28px  rgba(125, 211, 252, 0.95), 0 0 56px rgba(125, 211, 252, 0.55)';
        const isLocked = line.isLocked;
        const isPlacementTarget = !isLocked && isPlacementValid(line, index);

        const placementClickable = Boolean(canPlace && onPlaceRunes);
        const imageDimension = RUNE_SIZE_CONFIG['large'].dimension;
        return (
          <button
            key={index}
            onClick={() => {
              console.log('Pattern line clicked', { index, isPlacementTarget, line });
              placeRunes(index);
            }}
            disabled={false}
            className='flex flex-row gap-1'
            data-active={isKeyboardActive ? 'true' : undefined}
          >
            {Array(line.capacity)
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
