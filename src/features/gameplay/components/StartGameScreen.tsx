/**
 * StartGameScreen component - displays welcome screen before game begins
 */

interface StartGameScreenProps {
  onStartGame: () => void;
}

export function StartGameScreen({ onStartGame }: StartGameScreenProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '16px' : '32px'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        border: '4px solid #eab308', 
        borderRadius: isMobile ? '12px' : '16px', 
        padding: isMobile ? '32px 20px' : '48px 32px', 
        maxWidth: isMobile ? '100%' : '600px', 
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '32px' : '48px', 
          fontWeight: 'bold', 
          color: '#667eea', 
          marginBottom: '6px',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          Massive Spell
        </h1>
        
        <h2 style={{ 
          fontSize: isMobile ? '20px' : '24px', 
          fontWeight: '600', 
          color: '#764ba2', 
          marginBottom: '32px' 
        }}>
          Arcane Arena
        </h2>
        
        <div style={{ 
          marginBottom: '32px', 
          fontSize: isMobile ? '14px' : '16px',
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
        
        <button
          onClick={onStartGame}
          style={{
            backgroundColor: '#eab308',
            color: '#111827',
            fontWeight: 'bold',
            padding: isMobile ? '16px 32px' : '20px 48px',
            borderRadius: '12px',
            fontSize: isMobile ? '18px' : '24px',
            width: '100%',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
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
        
        <div style={{ 
          marginTop: '24px', 
          fontSize: isMobile ? '12px' : '14px', 
          color: '#9ca3af' 
        }}>
          Tap the Rules button in-game to learn how to play
        </div>
      </div>
    </div>
  );
}
