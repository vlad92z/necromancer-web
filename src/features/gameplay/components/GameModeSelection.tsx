/**
 * GameModeSelection component - Allows player to choose PvP or PvE
 */

import type { GameMode, Player } from '../../../types/game';

interface GameModeSelectionProps {
  onSelectMode: (mode: GameMode) => void;
  previousGameResult?: {
    players: [Player, Player];
    winner: Player | null;
  };
}

export function GameModeSelection({ onSelectMode, previousGameResult }: GameModeSelectionProps) {
  console.log('GameModeSelection rendered with previousGameResult:', previousGameResult)
  
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
        {previousGameResult ? (
          <>
            <h2 
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '24px',
                color: 'rgb(250, 204, 21)',
              }}
            >
              Game Over!
            </h2>
            
            <div style={{ marginBottom: '24px' }}>
              <div 
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  backgroundColor: previousGameResult.players[0].score >= previousGameResult.players[1].score 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgb(55, 65, 81)',
                  border: previousGameResult.players[0].score >= previousGameResult.players[1].score 
                    ? '2px solid rgb(34, 197, 94)' 
                    : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'white' }}>{previousGameResult.players[0].name}</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    {previousGameResult.players[0].score}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'rgb(156, 163, 175)', marginTop: '4px' }}>
                  Runes remaining: {previousGameResult.players[0].deck.length}
                </div>
              </div>
              
              <div 
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: previousGameResult.players[1].score >= previousGameResult.players[0].score 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgb(55, 65, 81)',
                  border: previousGameResult.players[1].score >= previousGameResult.players[0].score 
                    ? '2px solid rgb(34, 197, 94)' 
                    : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'white' }}>{previousGameResult.players[1].name}</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                    {previousGameResult.players[1].score}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: 'rgb(156, 163, 175)', marginTop: '4px' }}>
                  Runes remaining: {previousGameResult.players[1].deck.length}
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              {previousGameResult.winner ? (
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgb(250, 204, 21)' }}>
                  🏆 {previousGameResult.winner.name} Wins! 🏆
                </div>
              ) : (
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'rgb(96, 165, 250)' }}>
                  It's a Tie!
                </div>
              )}
            </div>

            <h3 
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '16px',
                color: 'rgb(147, 197, 253)',
              }}
            >
              Play Again?
            </h3>
          </>
        ) : (
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
        )}
        
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
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
