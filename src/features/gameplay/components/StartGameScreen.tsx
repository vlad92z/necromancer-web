/**
 * StartGameScreen component - displays welcome screen before game begins
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RulesOverlay } from './RulesOverlay';

interface StartGameScreenProps {
  onStartGame: (gameMode: 'classic' | 'standard') => void;
}

export function StartGameScreen({ onStartGame }: StartGameScreenProps) {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<'classic' | 'standard'>('standard');
  const [showRules, setShowRules] = useState(false);
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: '#0f1724',
        border: '2px solid rgba(74,158,255,0.12)',
        borderRadius: '12px', 
        padding: '36px 28px', 
        maxWidth: '700px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 12px 36px rgba(2,6,23,0.6)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: 'transparent',
              color: '#9fb7ff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px'
            }}
          >
            ← Back
          </button>
        </div>

        <h1 style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: '#ffffff', 
          marginBottom: '6px'
        }}>
          Massive Spell
        </h1>

        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#9fb7ff', 
          marginBottom: '20px' 
        }}>
          Arcane Arena
        </h2>
        
        <div style={{ 
          marginBottom: '24px', 
          fontSize: '16px',
          color: '#c7d2fe',
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
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#071029',
          borderRadius: '8px',
          border: '1px solid rgba(74,158,255,0.08)'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#cfe0ff',
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
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: gameMode === 'classic' ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: gameMode === 'classic' ? '#4a9eff' : 'transparent',
                color: gameMode === 'classic' ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (gameMode !== 'classic') e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (gameMode !== 'classic') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Classic
            </button>
            <button
              onClick={() => setGameMode('standard')}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: gameMode === 'standard' ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: gameMode === 'standard' ? '#4a9eff' : 'transparent',
                color: gameMode === 'standard' ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (gameMode !== 'standard') e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (gameMode !== 'standard') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Standard
            </button>
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#9fb7ff',
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
            backgroundColor: '#4a9eff',
            color: '#ffffff',
            fontWeight: '700',
            padding: '16px 24px',
            borderRadius: '10px',
            fontSize: '18px',
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.18s',
            boxShadow: '0 6px 18px rgba(74,158,255,0.14)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5ab0ff';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(74,158,255,0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a9eff';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(74,158,255,0.14)';
          }}
        >
          Start Game
        </button>
        
        <button
          onClick={() => setShowRules(true)}
          style={{
            backgroundColor: 'transparent',
            color: '#4a9eff',
            fontWeight: '600',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '15px',
            width: '100%',
            border: '2px solid rgba(74,158,255,0.16)',
            cursor: 'pointer',
            transition: 'all 0.14s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4a9eff';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#4a9eff';
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
