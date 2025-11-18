/**
 * StartGameScreen component - displays welcome screen before game begins
 */

import { useState } from 'react';
import { RulesOverlay } from './RulesOverlay';

interface StartGameScreenProps {
  onStartGame: (gameMode: 'classic' | 'standard') => void;
}

export function StartGameScreen({ onStartGame }: StartGameScreenProps) {
  const [gameMode, setGameMode] = useState<'classic' | 'standard'>('standard');
  const [showRules, setShowRules] = useState(false);
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '32px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        border: '4px solid #eab308', 
        borderRadius: '16px', 
        padding: '48px 32px', 
        maxWidth: '600px', //TODO'100%'?
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: '#667eea', 
          marginBottom: '6px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Massive Spell
        </h1>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#764ba2', 
          marginBottom: '32px' 
        }}>
          Arcane Arena
        </h2>
        
        <div style={{ 
          marginBottom: '32px', 
          fontSize: '16px',
          color: '#4b5563',
          lineHeight: '1.6'
        }}>
          <p style={{ marginBottom: '12px' }}>
            Prepare powerful runes from mystical Runeforges and craft strategic spell patterns.
          </p>
          <p style={{ marginBottom: '12px' }}>
            Complete your Spellcasting Lines and place runes on your Spell Wall to unleash devastating combos!
          </p>
        </div>
        
        {/* Game Mode Toggle */}
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '2px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '12px'
          }}>
            Game Mode
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setGameMode('classic')}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: gameMode === 'classic' ? '#667eea' : '#cbd5e1',
                backgroundColor: gameMode === 'classic' ? '#667eea' : '#ffffff',
                color: gameMode === 'classic' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Classic
            </button>
            <button
              onClick={() => setGameMode('standard')}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: gameMode === 'standard' ? '#667eea' : '#cbd5e1',
                backgroundColor: gameMode === 'standard' ? '#667eea' : '#ffffff',
                color: gameMode === 'standard' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Standard
            </button>
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#64748b',
            textAlign: 'center'
          }}>
            {gameMode === 'classic' 
              ? 'Simpler version of the game. All runes are the same.' 
              : 'Runes have unique modifiers that affect gameplay.'}
          </div>
        </div>
        
        <button
          onClick={() => onStartGame(gameMode)}
          style={{
            backgroundColor: '#eab308',
            color: '#111827',
            fontWeight: 'bold',
            padding: '20px 48px',
            borderRadius: '12px',
            fontSize: '24px',
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ca8a04';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 179, 8, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#eab308';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 179, 8, 0.3)';
          }}
        >
          Start Game
        </button>
        
        <button
          onClick={() => setShowRules(true)}
          style={{
            backgroundColor: 'transparent',
            color: '#667eea',
            fontWeight: '600',
            padding: '14px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            width: '100%',
            border: '2px solid #667eea',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#667eea';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#667eea';
          }}
        >
          📖 How to Play
        </button>
      </div>
      
      {/* Rules Overlay */}
      {showRules && (
        <RulesOverlay onClose={() => setShowRules(false)} />
      )}
    </div>
  );
}
