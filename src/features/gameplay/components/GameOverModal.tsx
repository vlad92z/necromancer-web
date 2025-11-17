/**
 * GameOverModal component - displays game over screen with winner and damage taken
 */

import type { Player } from '../../../types/game';

interface GameOverModalProps {
  players: [Player, Player];
  winner: Player | null;
  onReturnToStart?: () => void;
}

export function GameOverModal({ players, winner, onReturnToStart }: GameOverModalProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      border: '4px solid #eab308', 
      borderRadius: isMobile ? '12px' : '16px', 
      padding: isMobile ? '20px' : '32px', 
      maxWidth: isMobile ? '100%' : '72rem', 
      minWidth: isMobile ? '100%' : '50rem', 
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
    }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#eab308', marginBottom: '24px' }}>
          {winner?.id === 'player-1' ? 'Victory!' : winner ? 'Defeat!' : 'Draw!'}
        </h2>
        
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>
            {winner ? `${winner.name} Wins!` : "It's a Tie!"}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: winner?.id === 'player-1' ? '2px solid #22c55e' : 'none' }}>
              <span style={{ fontWeight: '600' }}>{players[0].name}</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>{players[1].score} damage taken</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: winner?.id === 'player-2' ? '2px solid #22c55e' : 'none' }}>
              <span style={{ fontWeight: '600' }}>{players[1].name}</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>{players[0].score} damage taken</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onReturnToStart}
          style={{
            backgroundColor: '#eab308',
            color: '#111827',
            fontWeight: 'bold',
            padding: '12px 32px',
            borderRadius: '8px',
            fontSize: '18px',
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ca8a04'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#eab308'}
        >
          Return to Start
        </button>
      </div>
  );
}
