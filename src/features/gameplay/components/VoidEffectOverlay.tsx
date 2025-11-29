/**
 * VoidEffectOverlay component - legacy UI for resolving the Void effect.
 * NOTE: The live Void effect now destroys a single rune; update this overlay if re-enabled.
 */

import type { Runeforge } from '../../../types/game';

interface VoidEffectOverlayProps {
  factories: Runeforge[];
  onSelectFactory: (runeforgeId: string) => void;
  onSkip: () => void;
  isVisible: boolean; // Control visibility (hide during AI decision)
}

export function VoidEffectOverlay({ factories, onSelectFactory, onSkip, isVisible }: VoidEffectOverlayProps) {
  
  // Get only non-empty factories
  const nonEmptyFactories = factories.filter(f => f.runes.length > 0);
  
  // Don't render if not visible (during AI turn)
  if (!isVisible) return null;
  
  if (nonEmptyFactories.length === 0) {
    // No factories to destroy, auto-skip
    onSkip();
    return null;
  }
  
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '32px',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '540px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '2px solid #8B008B',
          boxShadow: '0 0 20px rgba(139, 0, 139, 0.5)',
        }}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '28px',
            color: '#8B008B',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          🌑 Void Effect
        </h2>
        
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '16px',
            color: '#e2e8f0',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          Legacy overlay: update to rune-level targeting if the Void effect is handled here again.
        </p>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {nonEmptyFactories.map((runeforge) => (
            <button
              key={runeforge.id}
              onClick={() => onSelectFactory(runeforge.id)}
              style={{
                padding: '16px',
                backgroundColor: '#2d3748',
                border: '2px solid #8B008B',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#e2e8f0',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4a5568';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(139, 0, 139, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2d3748';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Runeforge {parseInt(runeforge.id.replace('runeforge-', '')) + 1}
              <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
                {runeforge.runes.length} rune{runeforge.runes.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onSkip}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#475569',
            border: '2px solid #64748b',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: '#e2e8f0',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#64748b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#475569';
          }}
        >
          Skip Void Effect
        </button>
      </div>
    </div>
  );
}
