/**
 * PlayerBoard component - displays a player's board (pattern lines, wall, floor line)
 */

import type { Player, RuneType } from '../../../../types/game';
import { PatternLines } from './PatternLines';
import { ScoringWall } from './ScoringWall';
import { TooltipView } from './TooltipView';

interface PlayerBoardProps {
  player: Player;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType?: RuneType | null;
  canPlace?: boolean;
  onCancelSelection?: () => void;
  lockedLineIndexes?: number[];
  hiddenSlotKeys?: Set<string>;
  runeScore: {
    currentScore: number;
    targetScore: number;
  };
}

export function PlayerBoard({
  player,
  onPlaceRunes,
  onPlaceRunesInFloor,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  lockedLineIndexes,
  hiddenSlotKeys,
  runeScore,
}: PlayerBoardProps) {
  const handleBoardClick = () => {
    if (canPlace && onCancelSelection) {
      onCancelSelection();
    }
  };

  return (
    <div
      onClick={handleBoardClick}
      className="relative w-full h-full p-[min(1.2vmin,16px)]"
    >
      <div className="flex items-stretch justify-between gap-[min(1.5vmin,18px)] w-full h-full">
        <div className="flex-1 flex flex-col gap-[min(1.2vmin,12px)] h-full min-h-0">
          <div className="shrink-0">
            <div className="grid grid-cols-2 items-start gap-[min(1.2vmin,14px)]">
              {/* Pattern Lines */}
              <div className="col-start-1" onClick={(e) => e.stopPropagation()}>
                <PatternLines
                  patternLines={player.patternLines}
                  wall={player.wall}
                  onPlaceRunes={onPlaceRunes}
                  selectedRuneType={selectedRuneType}
                  canPlace={canPlace}
                  playerId={player.id}
                  hiddenSlotKeys={hiddenSlotKeys}
                  lockedLineIndexes={lockedLineIndexes}
                />
              </div>

              {/* Wall */}
              <div className="col-start-2 flex flex-col items-center gap-[min(0.7vmin,12px)]">
                <ScoringWall wall={player.wall} patternLines={player.patternLines} />
              </div>
            </div>
          </div>
          <div className="w-full h-[clamp(190px,32vmin,360px)] min-h-0 flex items-center justify-center">
            <TooltipView />
          </div>
        </div>
      </div>
    </div>
  );
}
