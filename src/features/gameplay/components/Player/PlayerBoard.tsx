/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import { useGameplayStore } from '../../../../state/stores';
import type { Rune, RuneType } from '../../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { TooltipView } from './TooltipView';

interface PlayerBoardProps {
  onPlaceRunes?: (patternLineIndex: number) => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  hiddenSlotKeys?: Set<string>;
  selectedRunes: Rune[];
  strain: number;
  lockedPatternLines: number[];
}

export function PlayerBoard({
  onPlaceRunes,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  hiddenSlotKeys,
  selectedRunes,
  strain,
  lockedPatternLines,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };
  const player = useGameplayStore((state) => state.player);
  return (
    <div
      onClick={handleBoardClick}
      className="w-full h-full p-5"
    >
      <div className="flex flex-col gap-[min(1.2vmin,12px)] h-full">
        <div className="flex flex-row gap-5">
          <PatternLines
            onPlaceRunes={onPlaceRunes}
            selectedRuneType={selectedRuneType}
            canPlace={canPlace}
            hiddenSlotKeys={hiddenSlotKeys}
            selectedRunes={selectedRunes}
            strain={strain}
            patternLines={player.patternLines}
            wall={player.wall}
            lockedPatternLines={lockedPatternLines}
          />
          <ScoringWall wall={player.wall} patternLines={player.patternLines} />
        </div>
        <TooltipView/>
      </div>
    </div>
  );
}
