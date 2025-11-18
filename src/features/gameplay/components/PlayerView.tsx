/**
 * PlayerView component - displays the human player's board
 */

import type { Player, RuneType } from '../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface PlayerViewProps {
  player: Player;
  opponent: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType: RuneType | null;
  canPlace: boolean;
  onCancelSelection: () => void;
  gameMode: 'classic' | 'standard';
}

export function PlayerView({
  player,
  opponent,
  isActive,
  onPlaceRunes,
  onPlaceRunesInFloor,
  selectedRuneType,
  canPlace,
  onCancelSelection,
  gameMode,
}: PlayerViewProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <PlayerBoard
        player={player}
        opponent={opponent}
        isActive={isActive}
        onPlaceRunes={onPlaceRunes}
        onPlaceRunesInFloor={onPlaceRunesInFloor}
        selectedRuneType={selectedRuneType}
        canPlace={canPlace}
        onCancelSelection={onCancelSelection}
        gameMode={gameMode}
        damageTaken={opponent.score}
        nameColor="#0c4a6e"
      />
    </div>
  );
}
