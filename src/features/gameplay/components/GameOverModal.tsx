/**
 * GameOverModal component - displays game over screen with winner and damage taken
 */

import type { Player } from '../../../types/game';
import { useClickSound } from '../../../hooks/useClickSound';

interface GameOverModalProps {
  players: [Player, Player];
  winner: Player | null;
  onReturnToStart?: () => void;
}

export function GameOverModal({ players, winner, onReturnToStart }: GameOverModalProps) {
  const playClickSound = useClickSound();
  const winnerId = winner?.id ?? null;
  const playerIsWinner = winnerId === players[0].id;
  const opponentIsWinner = winnerId === players[1].id;
  const headline = winner
    ? playerIsWinner
      ? 'Arcane Triumph'
      : 'GAME OVER'
    : 'Stalemate';
  const subline = winner
    ? `${winner.name} seizes control of the arena`
    : 'Both channels collapse simultaneously';
  const accentColor = playerIsWinner
    ? '#34d399'
    : opponentIsWinner
      ? '#f87171'
      : '#facc15';

  const renderPlayerRow = (player: Player, isWinner: boolean) => (
    <div
      key={player.id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderRadius: '18px',
        border: `1px solid ${isWinner ? 'rgba(52, 211, 153, 0.5)' : 'rgba(148, 163, 184, 0.25)'}`,
      background: isWinner
          ? 'linear-gradient(120deg, rgba(6, 78, 59, 0.55), rgba(5, 32, 45, 0.75))'
          : 'rgba(9, 12, 33, 0.85)',
        boxShadow: isWinner ? '0 12px 28px rgba(16, 185, 129, 0.25)' : 'none',
        gap: '12px'
      }}
    >
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>{player.name}</div>
        <div style={{ fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.75)' }}>
          {isWinner ? 'Dominates the arena' : ''}
        </div>
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fda4af' }}>
        {player.health} HP
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: 'rgba(5, 2, 16, 0.95)',
        borderRadius: '32px',
        padding: '32px 28px',
        width: 'min(520px, 92vw)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        color: '#f5f5ff',
        textAlign: 'center',
        boxShadow: '0 45px 120px rgba(0, 0, 0, 0.75)'
      }}
    >
      <div
        style={{
          padding: '16px',
          borderRadius: '18px',
          border: `1px solid ${accentColor}`,
          background: `linear-gradient(120deg, ${accentColor}22, rgba(58, 12, 163, 0.35))`,
          marginBottom: '24px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontSize: '0.85rem',
          fontWeight: 700
        }}
      >
        {headline}
      </div>
      <div style={{ fontSize: '1.1rem', color: '#e9d5ff', marginBottom: '32px' }}>{subline}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
        {renderPlayerRow(players[0], playerIsWinner)}
        {renderPlayerRow(players[1], opponentIsWinner)}
      </div>

      <button
        type="button"
        onClick={() => {
          playClickSound();
          if (onReturnToStart) {
            onReturnToStart();
          }
        }}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'linear-gradient(120deg, rgba(248, 250, 252, 0.12), rgba(103, 232, 249, 0.08))',
          color: '#f1f5f9',
          fontSize: '0.95rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          boxShadow: '0 18px 45px rgba(8, 17, 35, 0.6)',
          transition: 'transform 0.15s ease'
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Main Menu
      </button>
    </div>
  );
}
