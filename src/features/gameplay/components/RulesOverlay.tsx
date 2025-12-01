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
              Finish pattern lines to strike immediately. Each placement deals damage based on the segment it connects to. The player with the most health wins!
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
              • Surplus runes cause overload damage (Solo triggers immediately)<br/>
              • Complete a line to add that rune to your wall and clear the line<br/>
              • Runes are connected if they share an edge (not diagonal)
            </p>
          </section>
          
          <section>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0369a1', marginBottom: '8px' }}>
              ⚔️ Dealing Damage
            </h3>
            <p style={{ margin: 0 }}>
              • When a pattern line fills, its rune moves to your wall immediately<br/>
              • That rune deals damage right away equal to the size of the connected segment it joins (minimum 1)<br/>
              • Build dense clusters so every future placement hits harder<br/>
              • In Solo runs, overload damage still applies the moment you overflow to the floor
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
