/**
 * VoidEffectOverlay component - allows player to select a factory to destroy with Void effect
 */

import type { Factory } from '../../../types/game';

interface VoidEffectOverlayProps {
  factories: Factory[];
  onSelectFactory: (factoryId: string) => void;
  onSkip: () => void;
  isVisible: boolean; // Control visibility (hide during AI decision)
}

export function VoidEffectOverlay({ factories, onSelectFactory, onSkip, isVisible }: VoidEffectOverlayProps) {
  const isMobile = window.innerWidth < 768;
  
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
        padding: isMobile ? '16px' : '32px',
      }}
    >
      <div
        style={{
          backgroundColor: '#1e293b',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '20px' : '32px',
          maxWidth: '600px',
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
            fontSize: isMobile ? '20px' : '28px',
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
            fontSize: isMobile ? '14px' : '16px',
            color: '#e2e8f0',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          Choose a factory to destroy all its runes, or skip this effect.
        </p>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? '12px' : '16px',
            marginBottom: '24px',
          }}
        >
          {nonEmptyFactories.map((factory) => (
            <button
              key={factory.id}
              onClick={() => onSelectFactory(factory.id)}
              style={{
                padding: isMobile ? '12px' : '16px',
                backgroundColor: '#2d3748',
                border: '2px solid #8B008B',
                borderRadius: isMobile ? '8px' : '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#e2e8f0',
                fontSize: isMobile ? '14px' : '16px',
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
              Factory {parseInt(factory.id.replace('factory-', '')) + 1}
              <div style={{ fontSize: isMobile ? '12px' : '14px', marginTop: '8px', opacity: 0.8 }}>
                {factory.runes.length} rune{factory.runes.length !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onSkip}
          style={{
            width: '100%',
            padding: isMobile ? '12px' : '16px',
            backgroundColor: '#475569',
            border: '2px solid #64748b',
            borderRadius: isMobile ? '8px' : '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            color: '#e2e8f0',
            fontSize: isMobile ? '14px' : '16px',
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
