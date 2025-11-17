/**
 * GameOverModal component - displays game over screen with winner and scores
 */

import type { Player } from '../../../types/game';

interface GameOverModalProps {
  players: [Player, Player];
  winner: Player | null;
  onNextGame?: () => void;
}

export function GameOverModal({ players, winner, onNextGame }: GameOverModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ backgroundColor: '#111827', border: '4px solid #eab308', borderRadius: '16px', padding: '32px', maxWidth: '28rem', width: '100%', margin: '0 16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#eab308', marginBottom: '24px' }}>
          {winner?.id === 'player-1' ? 'Victory!' : winner ? 'Defeat!' : 'Draw!'}
        </h2>
        
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>
            {winner ? `${winner.name} Wins!` : "It's a Tie!"}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', border: winner?.id === 'player-1' ? '2px solid #22c55e' : 'none' }}>
              <span style={{ fontWeight: '600' }}>{players[0].name}</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{players[0].score}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1f2937', padding: '12px', borderRadius: '8px', border: winner?.id === 'player-2' ? '2px solid #22c55e' : 'none' }}>
              <span style={{ fontWeight: '600' }}>{players[1].name}</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171' }}>{players[1].score}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={onNextGame}
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
          Play Again
        </button>
      </div>
    </div>
  );
}
