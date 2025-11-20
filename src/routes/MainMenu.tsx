import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SpectatorModePanel } from '../components/SpectatorModePanel'
import { useGameActions } from '../hooks/useGameActions'
import type { Difficulty } from '../types/game'

export function MainMenu() {
  const navigate = useNavigate()
  const { startSpectatorMatch } = useGameActions()
  const [showSpectatorPanel, setShowSpectatorPanel] = useState(false)

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

  const handleQuickPlay = () => {
    navigate('/game')
  }

  const handleSpectatorMode = () => {
    setShowSpectatorPanel(!showSpectatorPanel)
  }

  const handleStartSpectator = (topDifficulty: Difficulty, bottomDifficulty: Difficulty) => {
    startSpectatorMatch(topDifficulty, bottomDifficulty)
    navigate('/game')
  }

  const handleCloseSpectator = () => {
    setShowSpectatorPanel(false)
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
          style={buttonStyle}
          onClick={handleSpectatorMode}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5ab0ff'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a9eff'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Spectator Mode
        </button>
        
        {showSpectatorPanel && (
          <SpectatorModePanel
            onStart={handleStartSpectator}
            onClose={handleCloseSpectator}
          />
        )}
        
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
      </div>
    </div>
  )
}
