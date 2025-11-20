/**
 * PlayerView component - displays the human player's board
 */

import type { Player, RuneType } from '../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface PlayerViewProps {
  player: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType: RuneType | null;
  canPlace: boolean;
  onCancelSelection: () => void;
  gameMode: 'classic' | 'standard';
  frozenPatternLines: number[];
  onShowDeck: () => void;
  onShowLog: () => void;
  onShowRules: () => void;
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
}

export function PlayerView({
  player,
  isActive,
  onPlaceRunes,
  onPlaceRunesInFloor,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  gameMode,
  frozenPatternLines,
  onShowDeck,
  onShowLog,
  onShowRules,
  hiddenSlotKeys,
  hiddenFloorSlotIndexes,
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
        gameMode={gameMode}
        nameColor="#0c4a6e"
        frozenPatternLines={frozenPatternLines}
        onShowDeck={onShowDeck}
        onShowLog={onShowLog}
        onShowRules={onShowRules}
        hiddenSlotKeys={hiddenSlotKeys}
        hiddenFloorSlotIndexes={hiddenFloorSlotIndexes}
      />
    </div>
  );
}
