/**
 * OpponentView component - displays the AI opponent's board (read-only view)
 */

import type { Player } from '../../../types/game';
import { PlayerBoard } from './PlayerBoard';

interface OpponentViewProps {
  opponent: Player;
  isActive: boolean;
}

export function OpponentView({ opponent, isActive }: OpponentViewProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ marginBottom: isMobile ? '12px' : '24px' }}>
      <div style={{ 
        marginBottom: isMobile ? '4px' : '8px', 
        fontSize: isMobile ? '12px' : '18px',
        fontWeight: 'bold',
        color: '#7c2d12',
        textAlign: 'center'
      }}>
        {opponent.name} - Score: {opponent.score}
        {isActive && <span style={{ marginLeft: '8px', color: '#ea580c' }}>(Taking Turn...)</span>}
      </div>
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
