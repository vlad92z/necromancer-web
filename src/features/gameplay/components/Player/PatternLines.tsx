/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import { RUNE_SIZE_CONFIG } from '../../../../styles/tokens';
import { useSelectionStore } from '../../../../state/stores';
import { useSoloGameStore } from '../../../../state/stores/soloGameStore';
import { canPlaceSelectionOnPatternLine } from '../../../../state/stores/soloGameStoreHelpers';

interface PatternLinesProps {
  canPlace?: boolean;
  activePatternLineIndex?: number | null;
}

export function PatternLines({
  canPlace,
  activePatternLineIndex,
}: PatternLinesProps) {
  const patternLines = useSoloGameStore((state) => state.patternLines);
  const spellWall = useSoloGameStore((state) => state.spellWall);
  const selectedRunes = useSelectionStore((state) => state.selectedCards);
  const placeRunes = useSoloGameStore((state) => state.placeRunes);

  /**
   * isPlacementValid - check whether the current selection can be placed on a pattern line.
   */
  const isPlacementValid = (lineIndex: number): boolean => {
    if (!canPlace) {
      return false;
    }

    return canPlaceSelectionOnPatternLine(
      { patternLines, spellWall },
      lineIndex,
      selectedRunes
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-start', width: '100%' }}>
      {patternLines.map((line, index) => {
        const isKeyboardActive = activePatternLineIndex === index;
        const isLocked = line.isLocked;
        const isPlacementTarget = !isLocked && isPlacementValid(index);
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
