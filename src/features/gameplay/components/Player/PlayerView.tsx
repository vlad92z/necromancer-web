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
  gameMode: 'classic' | 'standard';
  frozenPatternLines: number[];
  lockedPatternLines?: number[];
  hiddenSlotKeys?: Set<string>;
  hiddenFloorSlotIndexes?: Set<number>;
  round: number;
  hideStatsPanel?: boolean;
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
  gameMode,
  frozenPatternLines,
  lockedPatternLines,
  hiddenSlotKeys,
  hiddenFloorSlotIndexes,
  round,
  hideStatsPanel = false,
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
        gameMode={gameMode}
        nameColor="#0c4a6e"
        frozenPatternLines={frozenPatternLines}
        lockedPatternLines={lockedPatternLines}
        hiddenSlotKeys={hiddenSlotKeys}
        hiddenFloorSlotIndexes={hiddenFloorSlotIndexes}
        round={round}
        hideStatsPanel={hideStatsPanel}
        soloRuneScore={soloRuneScore}
      />
    </div>
  );
}
