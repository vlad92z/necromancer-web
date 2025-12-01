import { useNavigate } from 'react-router-dom'
import { useClickSound } from '../hooks/useClickSound'

export function MainMenu() {
  const navigate = useNavigate()
  const playClickSound = useClickSound()

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


  const handleSolo = () => {
    playClickSound()
    navigate('/solo')
  }
  
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Massive Spell: Arcane Arena</h1>
      <p style={subtitleStyle}>A roguelite deck-builder</p>
      
      <div style={menuStyle}>
        <button
          style={buttonStyle}
          onClick={handleSolo}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5ab0ff'
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4a9eff'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          Solo
        </button>
      </div>
    </div>
  )
}
