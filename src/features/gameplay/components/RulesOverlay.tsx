/**
 * RulesOverlay component - displays game rules explanation
 */

interface RulesOverlayProps {
  onClose: () => void;
}

export function RulesOverlay({ onClose }: RulesOverlayProps) {
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
        padding: '24px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '540px',
          width: '100%',
          color: '#1e293b',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0c4a6e', margin: 0 }}>
            How to Play
          </h2>
        </div>
        
        {/* Rules Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '16px', lineHeight: '1.6' }}>
          <section>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              🎯 Goal
            </h3>
            <p style={{ margin: 0 }}>
              Build spellpower to deal damage to your opponent each round. The player with the most health wins!
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              🎲 Spell Preparation Phase
            </h3>
            <p style={{ margin: 0, marginBottom: '8px' }}>
              1. Select a rune from any Runeforge to select all runes of that type<br/>
              2. Remaining runes from the Runeforge move to the center<br/>
              3. You can also pick runes from the center pool
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              📊 Spellcasting Lines
            </h3>
            <p style={{ margin: 0 }}>
              • Each line holds 1-5 runes<br/>
              • A line can only hold one type of rune<br/>
              • Surplus runes cause overload (end-of-round damage)<br/>
              • Complete a line to add that rune to your wall<br/>
              • Runes are connected if they share an edge (not diagonal)
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              ⚔️ Dealing Damage
            </h3>
            <p style={{ margin: 0 }}>
              • <strong>Essence</strong>: Total number of active runes on your wall<br/>
              • <strong>Focus</strong>: Size of your largest connected rune segment<br/>
              • <strong>Spellpower</strong>: Essence × Focus<br/>
              • Each round, deal Spellpower damage to your opponent<br/>
              • Overload builds damage at round end (Focus stays steady)<br/>
              • Build large connected segments to maximize damage!
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              🏁 End Game
            </h3>
            <p style={{ margin: 0 }}>
              The game ends when a player runs out of runes. The player who took the least damage wins!
            </p>
          </section>
          
          {/* Dismiss Button */}
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#0369a1',
              color: 'white',
              fontWeight: 'bold',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '16px',
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
