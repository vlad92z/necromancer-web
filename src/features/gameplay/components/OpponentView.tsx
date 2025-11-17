/**
 * OpponentView component - displays the AI opponent's board (read-only view)
 */

import type { Player } from '../../../types/game';
import { PlayerBoard } from './PlayerBoard';
import { RunePower } from './RunePower';

interface OpponentViewProps {
  opponent: Player;
  player: Player;
  isActive: boolean;
}

export function OpponentView({ opponent, player, isActive }: OpponentViewProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ marginBottom: isMobile ? '12px' : '24px' }}>
      <RunePower 
        player={opponent}
        damageTaken={player.score}
        nameColor="#0c4a6e"
      />
      <PlayerBoard
        player={opponent}
        isActive={isActive}
        // No interaction handlers for opponent view
        selectedRuneType={null}
        canPlace={false}
        onCancelSelection={() => {}}
      />
    </div>
  );
}
