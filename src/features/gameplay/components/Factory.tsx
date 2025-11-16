/**
 * Factory component - displays a factory with runes
 * Implements Azul-style drafting: click a rune type to select all of that type
 */

import type { Factory as FactoryType, RuneType } from '../../../types/game';
import { RuneToken } from '../../../components/RuneToken';

interface FactoryProps {
  factory: FactoryType;
  onDraftRune?: (factoryId: string, runeType: RuneType) => void;
  disabled?: boolean;
}

export function Factory({ factory, onDraftRune, disabled = false }: FactoryProps) {
  const handleRuneClick = (runeType: RuneType) => {
    if (!disabled && onDraftRune) {
      onDraftRune(factory.id, runeType);
    }
  };
  
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{
      backgroundColor: '#374151',
      borderRadius: isMobile ? '4px' : '12px',
      padding: isMobile ? '6px' : '16px',
      minWidth: isMobile ? '50px' : '120px',
      minHeight: isMobile ? '50px' : '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
    >
      {factory.runes.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: isMobile ? '6px' : '14px' }}>
          Empty
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? '2px' : '8px' }}>
          {factory.runes.map((rune) => (
            <button
              style={{
                width: isMobile ? '20px' : '60px',
                height: isMobile ? '20px' : '60px',
                outline: 'none',
                border: 'none',
                background: 'transparent',
                borderRadius: isMobile ? '3px' : '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                padding: 0
              }}
              key={rune.id}
              onClick={() => handleRuneClick(rune.runeType)}
              disabled={disabled}
              onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'scale(1)')}
              aria-label={`Select ${rune.runeType} rune from factory`}
            >
              <RuneToken 
                rune={rune} 
                size="small" 
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
