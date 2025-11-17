/**
 * PlayerView component - displays the human player's board
 */

import type { Player, RuneType } from '../../../types/game';
import { PlayerBoard } from './PlayerBoard';
import { RunePower } from './RunePower';

interface PlayerViewProps {
  player: Player;
  opponent: Player;
  isActive: boolean;
  onPlaceRunes?: (patternLineIndex: number) => void;
  onPlaceRunesInFloor?: () => void;
  selectedRuneType: RuneType | null;
  canPlace: boolean;
  onCancelSelection: () => void;
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
}: PlayerViewProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ marginBottom: isMobile ? '12px' : '24px' }}>
      <RunePower 
        player={player}
        damageTaken={opponent.score}
        nameColor="#0c4a6e"
      />
      <PlayerBoard
        player={player}
        isActive={isActive}
        onPlaceRunes={onPlaceRunes}
        onPlaceRunesInFloor={onPlaceRunesInFloor}
        selectedRuneType={selectedRuneType}
        canPlace={canPlace}
        onCancelSelection={onCancelSelection}
      />
    </div>
  );
}
