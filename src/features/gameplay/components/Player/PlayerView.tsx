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
  chapter: number;
  soloRuneScore?: {
    currentScore: number;
    targetScore: number;
  };
  deckCount?: number;
  strain?: number;
  onOpenDeck?: () => void;
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
  chapter,
  soloRuneScore,
  deckCount,
  strain,
  onOpenDeck,
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
        chapter={chapter}
        soloRuneScore={soloRuneScore}
        deckCount={deckCount}
        strain={strain}
        onOpenDeck={onOpenDeck}
      />
    </div>
  );
}
