/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import { useGameplayStore } from '../../../../state/stores';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { TooltipView } from './TooltipView';

interface PlayerBoardProps {
  onPlaceRunes?: (patternLineIndex: number) => void;
  onCancelSelection?: () => void;
  hiddenSlotKeys?: Set<string>;
  strain: number;
  lockedPatternLines: number[];
}

export function PlayerBoard({
  onPlaceRunes,
  onCancelSelection,
  hiddenSlotKeys,
  strain,
  lockedPatternLines,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (onCancelSelection) {
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
            hiddenSlotKeys={hiddenSlotKeys}
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
