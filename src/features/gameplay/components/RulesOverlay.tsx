/**
 * RulesOverlay component - displays game rules explanation
 */

interface RulesOverlayProps {
  onClose: () => void;
}

export function RulesOverlay({ onClose }: RulesOverlayProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        zIndex: 100,
        padding: isMobile ? '16px' : '24px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: isMobile ? '20px' : '32px',
          maxWidth: '600px',
          width: '100%',
          color: '#1e293b',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 'bold', color: '#0c4a6e', margin: 0 }}>
            How to Play
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '12px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            ✕ Close
          </button>
        </div>
        
        {/* Rules Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px', fontSize: isMobile ? '14px' : '16px', lineHeight: '1.6' }}>
          <section>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              🎯 Goal
            </h3>
            <p style={{ margin: 0 }}>
              Score the most points by strategically placing runes in your casting lines and completing patterns on your scoring wall.
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              🎲 Drafting Phase
            </h3>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              1. Click a rune from any factory to select all runes of that type<br/>
              2. Remaining runes from that factory move to the center<br/>
              3. You can also draft from the center pool
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              📊 Casting Lines
            </h3>
            <p style={{ margin: 0 }}>
              • Each line holds 1-5 runes (top to bottom)<br/>
              • A line can only hold one type of rune<br/>
              • Extra runes go to your floor line (penalties)<br/>
              • Complete a line to move one rune to your wall
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              ⭐ Scoring
            </h3>
            <p style={{ margin: 0 }}>
              • <strong>Essence</strong>: Total active runes on your wall<br/>
              • <strong>Focus</strong>: Size of your largest connected segment<br/>
              • <strong>Power</strong> = Essence × Focus<br/>
              • Floor line penalties reduce your Focus<br/>
              • Build large connected segments to maximize power!
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              🏁 End Game
            </h3>
            <p style={{ margin: 0 }}>
              The game ends when a player completes a horizontal row on their scoring wall. Highest score wins!
            </p>
          </section>
          
          {/* Dismiss Button */}
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#0369a1',
              color: 'white',
              fontWeight: 'bold',
              padding: isMobile ? '10px 24px' : '12px 32px',
              borderRadius: '8px',
              fontSize: isMobile ? '14px' : '16px',
              width: '100%',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
