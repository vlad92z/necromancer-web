import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameActions } from '../hooks/useGameActions'
import type { AIDifficulty } from '../types/game'

export function MainMenu() {
  const navigate = useNavigate()
  const { startSpectatorMatch } = useGameActions()
  
  const [spectatorModeOpen, setSpectatorModeOpen] = useState(false)
  const [topAIDifficulty, setTopAIDifficulty] = useState<AIDifficulty>('normal')
  const [bottomAIDifficulty, setBottomAIDifficulty] = useState<AIDifficulty>('normal')

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '20px',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textAlign: 'center',
  }

  const subtitleStyle: React.CSSProperties = {
    fontSize: '20px',
    marginBottom: '48px',
    color: '#aaaaaa',
    textAlign: 'center',
  }

  const menuStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '300px',
  }

  const buttonStyle: React.CSSProperties = {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#333333',
    color: '#666666',
    cursor: 'not-allowed',
    opacity: 0.5,
  }
  
  const spectatorPanelStyle: React.CSSProperties = {
    marginTop: '16px',
    padding: '20px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    width: '100%',
  }
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#aaaaaa',
  }
  
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #444444',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '16px',
  }
  
  const startButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    width: '100%',
    marginTop: '8px',
  }

  const handleQuickPlay = () => {
    navigate('/game')
  }
  
  const handleSpectatorModeToggle = () => {
    setSpectatorModeOpen(!spectatorModeOpen)
  }
  
  const handleStartSpectator = () => {
    startSpectatorMatch(topAIDifficulty, bottomAIDifficulty)
    navigate('/game')
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Massive Spell: Arcane Arena</h1>
      <p style={subtitleStyle}>A roguelite deck-building duel</p>
      
      <div style={menuStyle}>
        <button
          style={buttonStyle}
          onClick={handleQuickPlay}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5ab0ff'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a9eff'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Quick Play
        </button>
        
        <button
          style={disabledButtonStyle}
          disabled
          title="Campaign mode coming soon"
        >
          Campaign (Coming Soon)
        </button>
        
        <button
          style={disabledButtonStyle}
          disabled
          title="Deck builder coming soon"
        >
          Deck Builder (Coming Soon)
        </button>
        
        <button
          style={disabledButtonStyle}
          disabled
          title="Online multiplayer coming soon"
        >
          Matchmaking (Coming Soon)
        </button>
        
        <button
          style={buttonStyle}
          onClick={handleSpectatorModeToggle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5ab0ff'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a9eff'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          aria-label="Toggle spectator mode settings"
        >
          Spectator Mode {spectatorModeOpen ? '▲' : '▼'}
        </button>
        
        {spectatorModeOpen && (
          <div style={spectatorPanelStyle}>
            <div>
              <label htmlFor="top-ai-difficulty" style={labelStyle}>
                Top AI Difficulty
              </label>
              <select
                id="top-ai-difficulty"
                value={topAIDifficulty}
                onChange={(e) => setTopAIDifficulty(e.target.value as AIDifficulty)}
                style={selectStyle}
                aria-label="Select difficulty for top AI player"
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="bottom-ai-difficulty" style={labelStyle}>
                Bottom AI Difficulty
              </label>
              <select
                id="bottom-ai-difficulty"
                value={bottomAIDifficulty}
                onChange={(e) => setBottomAIDifficulty(e.target.value as AIDifficulty)}
                style={selectStyle}
                aria-label="Select difficulty for bottom AI player"
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <button
              style={startButtonStyle}
              onClick={handleStartSpectator}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5ab0ff'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4a9eff'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label="Start spectator match"
            >
              Start Spectator Match
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
