/**
 * StartGameScreen component - displays welcome screen before game begins
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuickPlayOpponent, RuneTypeCount } from '../../../types/game';
import { getAIDifficultyLabel } from '../../../utils/aiDifficultyLabels';
import { RulesOverlay } from './RulesOverlay';

interface StartGameScreenProps {
  onStartGame: (gameMode: 'classic' | 'standard', topController: QuickPlayOpponent, runeTypeCount: RuneTypeCount) => void;
}

export function StartGameScreen({ onStartGame }: StartGameScreenProps) {
  const navigate = useNavigate();
  const [gameMode] = useState<'classic' | 'standard'>('standard');
  const [opponentSetting, setOpponentSetting] = useState<QuickPlayOpponent>('normal');
  const [runeTypeCount, setRuneTypeCount] = useState<RuneTypeCount>(5);
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

        {/* Rune Type Count Toggle */}
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
            Rune Types
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setRuneTypeCount(3)}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: runeTypeCount === 3 ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: runeTypeCount === 3 ? '#4a9eff' : 'transparent',
                color: runeTypeCount === 3 ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (runeTypeCount !== 3) e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (runeTypeCount !== 3) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              3 Types
            </button>
            <button
              onClick={() => setRuneTypeCount(4)}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: runeTypeCount === 4 ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: runeTypeCount === 4 ? '#4a9eff' : 'transparent',
                color: runeTypeCount === 4 ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (runeTypeCount !== 4) e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (runeTypeCount !== 4) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              4 Types
            </button>
            <button
              onClick={() => setRuneTypeCount(5)}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: runeTypeCount === 5 ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: runeTypeCount === 5 ? '#4a9eff' : 'transparent',
                color: runeTypeCount === 5 ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (runeTypeCount !== 5) e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (runeTypeCount !== 5) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              5 Types
            </button>
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#9fb7ff',
            textAlign: 'center'
          }}>
            {runeTypeCount === 3 && '3 rune types (Fire, Life, Wind) with 3x3 wall and 3 pattern lines'}
            {runeTypeCount === 4 && '4 rune types (Fire, Life, Wind, Frost) with 4x4 wall and 4 pattern lines'}
            {runeTypeCount === 5 && '5 rune types (Fire, Life, Wind, Frost, Void) with 5x5 wall and 5 pattern lines'}
          </div>
        </div>

        {/* Difficulty Toggle */}
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
            Difficulty
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => setOpponentSetting('human')}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: opponentSetting === 'human' ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: opponentSetting === 'human' ? '#4a9eff' : 'transparent',
                color: opponentSetting === 'human' ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (opponentSetting !== 'human') e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (opponentSetting !== 'human') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Human
            </button>
            <button
              onClick={() => setOpponentSetting('easy')}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: opponentSetting === 'easy' ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: opponentSetting === 'easy' ? '#4a9eff' : 'transparent',
                color: opponentSetting === 'easy' ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (opponentSetting !== 'easy') e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (opponentSetting !== 'easy') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {getAIDifficultyLabel('easy')}
            </button>
            <button
              onClick={() => setOpponentSetting('normal')}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: opponentSetting === 'normal' ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: opponentSetting === 'normal' ? '#4a9eff' : 'transparent',
                color: opponentSetting === 'normal' ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (opponentSetting !== 'normal') e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (opponentSetting !== 'normal') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {getAIDifficultyLabel('normal')}
            </button>
            <button
              onClick={() => setOpponentSetting('hard')}
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                border: '2px solid',
                borderColor: opponentSetting === 'hard' ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                backgroundColor: opponentSetting === 'hard' ? '#4a9eff' : 'transparent',
                color: opponentSetting === 'hard' ? '#ffffff' : '#c7d2fe',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => {
                if (opponentSetting !== 'hard') e.currentTarget.style.backgroundColor = 'rgba(74,158,255,0.08)';
              }}
              onMouseLeave={(e) => {
                if (opponentSetting !== 'hard') e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {getAIDifficultyLabel('hard')}
            </button>
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '13px',
            color: '#9fb7ff',
            textAlign: 'center'
          }}>
            Choose who controls the top player. Selecting Human lets one person play both sides.
          </div>
        </div>
        
        <button
          onClick={() => onStartGame(gameMode, opponentSetting, runeTypeCount)}
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
