/**
 * GameModeSelection component - Allows player to choose PvP or PvE
 */

import type { GameMode } from '../../../types/game';

interface GameModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
}

export function GameModeSelection({ onSelectMode }: GameModeSelectionProps) {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div 
        style={{
          backgroundColor: 'rgb(31, 41, 55)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          border: '4px solid rgb(59, 130, 246)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2 
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '24px',
            color: 'rgb(147, 197, 253)',
          }}
        >
          Choose Game Mode
        </h2>
        
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <button
            onClick={() => onSelectMode('pvp')}
            style={{
              width: '100%',
              backgroundColor: 'rgb(37, 99, 235)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              padding: '20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(29, 78, 216)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            👥 Player vs Player
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
              Play against another human
            </div>
          </button>
          
          <button
            onClick={() => onSelectMode('pve')}
            style={{
              width: '100%',
              backgroundColor: 'rgb(126, 34, 206)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              padding: '20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(107, 33, 168)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(126, 34, 206)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🤖 Player vs Computer
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
              Play against AI (random moves)
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
