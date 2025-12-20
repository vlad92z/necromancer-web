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

  return (
    <div className='flex flex-col gap-1'>
      {patternLines.map((line, index) => {
        const isKeyboardActive = activePatternLineIndex === index;
        const isLocked = line.isLocked;
        const isPlacementTarget = !isLocked && canPlaceSelectionOnPatternLine(index, selectedRunes, patternLines, spellWall);
        const imageDimension = RUNE_SIZE_CONFIG['large'].dimension;
        const opacity = isLocked ? "opacity-25" : "";
        return (
          <button
            key={index}
            onClick={() => {
              console.log('Pattern line clicked', { index, isPlacementTarget, line });
              placeRunes(index);
            }}
            disabled={!isPlacementTarget}
            className={`inline-flex w-fit flex-row gap-1 self-start ${opacity} ${isPlacementTarget ? 'rounded-xl shadow-[0_0_16px_rgba(52,211,153,0.75)]' : ''}`}
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
                    className={`border rounded-xl border-slate-500/80 align-center p-1 ${slotIndex > 0 ? '' : 'bg-sky-900/50'}`}
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
