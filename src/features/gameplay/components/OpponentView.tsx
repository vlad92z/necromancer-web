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
  gameMode: 'classic' | 'standard';
}

export function OpponentView({ opponent, player, isActive, gameMode }: OpponentViewProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ marginBottom: isMobile ? '12px' : '24px' }}>
      <RunePower 
        player={opponent}
        opponent={player}
        damageTaken={player.score}
        nameColor="#7f1d1d"
        gameMode={gameMode}
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
