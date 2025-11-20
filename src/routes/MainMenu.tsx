import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameActions } from '../hooks/useGameActions'
import { runHeadlessSpectatorSeriesAsync } from '../utils/headlessSpectatorSimulation'
import { getAIDifficultyLabel } from '../utils/aiDifficultyLabels'
import type { AIDifficulty } from '../types/game'

export function MainMenu() {
  const navigate = useNavigate()
  const { startSpectatorMatch } = useGameActions()
  
  const [spectatorModeOpen, setSpectatorModeOpen] = useState(false)
  const [topAIDifficulty, setTopAIDifficulty] = useState<AIDifficulty>('normal')
  const [bottomAIDifficulty, setBottomAIDifficulty] = useState<AIDifficulty>('normal')
  const [headlessMode, setHeadlessMode] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [headlessResult, setHeadlessResult] = useState<{
    games: number;
    topWins: number;
    bottomWins: number;
    ties: number;
  } | null>(null)
  const [completedSimulations, setCompletedSimulations] = useState(0)

  const HEADLESS_GAME_COUNT = 10

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
  
  const toggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '14px',
    color: '#cccccc',
  }

  const resultBoxStyle: React.CSSProperties = {
    marginTop: '12px',
    padding: '12px',
    border: '1px solid #444',
    borderRadius: '8px',
    backgroundColor: '#1d1d1d',
    color: '#e5e7eb',
  }

  const progressContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '10px',
    backgroundColor: '#111',
    borderRadius: '999px',
    overflow: 'hidden',
    border: '1px solid #333',
    marginTop: '6px',
  }

  const progressBarStyle = (progressPercent: number): React.CSSProperties => ({
    height: '100%',
    width: `${progressPercent}%`,
    background: 'linear-gradient(90deg, #4a9eff, #60a5fa)',
    transition: 'width 150ms linear',
  })

  const handleStartSpectator = async () => {
    if (headlessMode) {
      setIsSimulating(true)
      setHeadlessResult(null)
      setCompletedSimulations(0)
      const result = await runHeadlessSpectatorSeriesAsync(
        topAIDifficulty,
        bottomAIDifficulty,
        HEADLESS_GAME_COUNT,
        (completed) => setCompletedSimulations(completed)
      )
      setHeadlessResult(result)
      setIsSimulating(false)
      return
    }
    
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
                <option value="easy">{getAIDifficultyLabel('easy')}</option>
                <option value="normal">{getAIDifficultyLabel('normal')}</option>
                <option value="hard">{getAIDifficultyLabel('hard')}</option>
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
                <option value="easy">{getAIDifficultyLabel('easy')}</option>
                <option value="normal">{getAIDifficultyLabel('normal')}</option>
                <option value="hard">{getAIDifficultyLabel('hard')}</option>
              </select>
            </div>

            <label style={toggleStyle}>
              <input
                type="checkbox"
                checked={headlessMode}
                onChange={(e) => setHeadlessMode(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              {`Headless Mode (simulate ${HEADLESS_GAME_COUNT} games, no UI)`}
            </label>
            {headlessMode && (
              <div style={{ marginBottom: '12px', color: '#ccc', fontSize: '13px' }}>
                Progress: {completedSimulations}/{HEADLESS_GAME_COUNT}
                <div style={progressContainerStyle}>
                  <div style={progressBarStyle((completedSimulations / HEADLESS_GAME_COUNT) * 100)} />
                </div>
              </div>
            )}
            
            <button
              style={startButtonStyle}
              onClick={handleStartSpectator}
              disabled={isSimulating}
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
              {isSimulating ? 'Simulating...' : headlessMode ? 'Run Headless Simulation' : 'Start Spectator Match'}
            </button>

            {headlessResult && (
              <div style={resultBoxStyle} aria-live="polite">
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Headless Results ({HEADLESS_GAME_COUNT} games)</div>
                <div>Top AI wins: {headlessResult.topWins}</div>
                <div>Bottom AI wins: {headlessResult.bottomWins}</div>
                <div>Ties: {headlessResult.ties}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
