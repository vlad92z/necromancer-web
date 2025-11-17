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
      <div style={{ 
        marginBottom: isMobile ? '4px' : '8px', 
        fontSize: isMobile ? '12px' : '18px',
        fontWeight: 'bold',
        color: '#0c4a6e',
        textAlign: 'center'
      }}>
        {player.name} - Damage Taken: {opponent.score}
      </div>
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
