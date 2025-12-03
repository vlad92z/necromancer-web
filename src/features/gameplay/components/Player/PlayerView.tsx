/**
 * PlayerView component - displays the human player's board
 */

import type { Player, RuneType } from '../../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface PlayerViewProps {
  player: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType: RuneType | null;
  canPlace: boolean;
  onCancelSelection: () => void;
  lockedPatternLines?: number[];
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
  round: number;
  soloRuneScore?: {
    currentScore: number;
    targetScore: number;
  };
}

export function PlayerView({
  player,
  isActive,
  onPlaceRunes,
  onPlaceRunesInFloor,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  lockedPatternLines,
  hiddenSlotKeys,
  hiddenFloorSlotIndexes,
  round,
  soloRuneScore,
}: PlayerViewProps) {
  return (
    <div>
      <PlayerBoard
        player={player}
        isActive={isActive}
        onPlaceRunes={onPlaceRunes}
        onPlaceRunesInFloor={onPlaceRunesInFloor}
        selectedRuneType={selectedRuneType}
        canPlace={canPlace}
        onCancelSelection={onCancelSelection}
        lockedLineIndexes={lockedPatternLines}
        hiddenSlotKeys={hiddenSlotKeys}
        hiddenFloorSlotIndexes={hiddenFloorSlotIndexes}
        round={round}
        soloRuneScore={soloRuneScore}
      />
    </div>
  );
}
