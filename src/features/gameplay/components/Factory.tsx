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
  
  return (
    <div style={{
      backgroundColor: '#374151',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '120px',
      minHeight: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
    >
      {factory.runes.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Empty
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {factory.runes.map((rune) => (
            <button
              style={{
                width: '60px',
                height: '60px',
                outline: 'none',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
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
