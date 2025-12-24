/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import { useGameplayStore, useUIStore } from '../../../../state/stores';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { TooltipView } from './TooltipView';

interface PlayerBoardProps {
  onPlaceRunes?: (patternLineIndex: number) => void;
}

export function PlayerBoard({
  onPlaceRunes,
}: PlayerBoardProps) {
  const cancelSelection = useGameplayStore((state) => state.cancelSelection);
  const isPlacementAnimating = useUIStore((state) => state.isPlacementAnimating);
  const handleBoardClick = () => {
    if (!isPlacementAnimating) {
      cancelSelection();
    }
  };
  return (
    <div
      onClick={handleBoardClick}
      className="w-full h-full p-5"
    >
      <div className="flex flex-col gap-[min(1.2vmin,12px)] h-full">
        <div className="flex flex-row gap-5">
          <PatternLines
            onPlaceRunes={onPlaceRunes}/>
          <ScoringWall/>
        </div>
        <TooltipView/>
      </div>
    </div>
  );
}
