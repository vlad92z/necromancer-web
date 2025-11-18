/**
 * OpponentView component - displays the AI opponent's board (read-only view)
 */

import type { Player } from '../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface OpponentViewProps {
  opponent: Player;
  player: Player;
  isActive: boolean;
  gameMode: 'classic' | 'standard';
}

export function OpponentView({ opponent, player, isActive, gameMode }: OpponentViewProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <PlayerBoard
        player={opponent}
        opponent={player}
        isActive={isActive}
        // No interaction handlers for opponent view
        selectedRuneType={null}
        canPlace={false}
        onCancelSelection={() => {}}
        gameMode={gameMode}
        nameColor="#7f1d1d"
        // Dummy overlay handlers (opponent doesn't need these)
        onShowDeck={() => {}}
        onShowLog={() => {}}
        onShowRules={() => {}}
      />
    </div>
  );
}
