/**
 * PatternLines component - displays a player's pattern lines
 * Clickable to place selected runes
 */

import { RUNE_SIZE_CONFIG } from '../../../../styles/tokens';
import { useSelectionStore } from '../../../../state/stores';
import { useSoloGameStore } from '../../../../state/stores/soloGameStore';
import { canPlaceSelectionOnPatternLine } from '../../../../state/stores/soloGameStoreHelpers';
import { runeAsset } from '../../../../components/runeAssets';
import { getRuneTitle } from '../../../../utils/runeHelpers';

interface PatternLinesProps {
  activePatternLineIndex?: number | null;
}

export function PatternLines({
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
    return canPlaceSelectionOnPatternLine(
      { patternLines, spellWall },
      lineIndex,
      selectedRunes
    );
  };

  return (
    <div className='flex flex-col gap-1'>
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
            disabled={!isPlacementTarget}
            className={`flex flex-row gap-1 ${isPlacementTarget ? 'ring-2 ring-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : ''}`}
            data-active={isKeyboardActive ? 'true' : undefined}
          >
            {Array(line.capacity)
              .fill(null)
              .map((_, slotIndex) => {
                const rune = line.runes[slotIndex];
                // console.log('Rendering pattern line slot', { lineIndex: index, slotIndex, rune });
                return (
                  <div
                    key={`${index}-${slotIndex}`}
                    className={`border rounded-xl border-slate-500/50 align-center p-1 ${slotIndex > 0 ? '' : 'bg-sky-900/20'}`}
                    style={{ width: imageDimension, height: imageDimension }}>
                      {rune && (
                        <img
                          src={runeAsset(rune.runeType, rune.rarity)}
                          alt={getRuneTitle(rune.runeType)}
                          style={{ width: imageDimension, height: imageDimension }}
                        />
                      )}
                  </div>
                );
              })}
          </button>
        );
      })}
    </div>
  );
}
