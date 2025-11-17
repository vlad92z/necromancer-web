/**
 * Factory component - displays a factory with runes
 * Implements Azul-style drafting: click a rune type to select all of that type
 */

import type { Factory as FactoryType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface FactoryProps {
  factory: FactoryType;
  onFactoryClick?: (factoryId: string) => void;
  disabled?: boolean;
}

export function Factory({ factory, onFactoryClick, disabled = false }: FactoryProps) {
  const handleClick = () => {
    if (!disabled && onFactoryClick && factory.runes.length > 0) {
      onFactoryClick(factory.id);
    }
  };
  
  const isMobile = window.innerWidth < 768;
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled || factory.runes.length === 0}
      style={{
        backgroundColor: '#e0f2fe',
        borderRadius: isMobile ? '4px' : '12px',
        padding: isMobile ? '6px' : '16px',
        minWidth: isMobile ? '50px' : '120px',
        minHeight: isMobile ? '50px' : '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        border: '2px solid #bae6fd',
        cursor: (disabled || factory.runes.length === 0) ? 'not-allowed' : 'pointer',
        outline: 'none'
      }}
      onMouseEnter={(e) => !disabled && factory.runes.length > 0 && (e.currentTarget.style.backgroundColor = '#bae6fd', e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e0f2fe', e.currentTarget.style.transform = 'scale(1)')}
      aria-label={`Open factory with ${factory.runes.length} runes`}
    >
      {factory.runes.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: isMobile ? '6px' : '14px' }}>
          Empty
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: isMobile ? '2px' : '8px' }}>
          {factory.runes.map((rune) => (
            <div
              key={rune.id}
              style={{
                width: isMobile ? '40px' : '60px',
                height: isMobile ? '40px' : '60px',
                pointerEvents: 'none'
              }}
            >
              <RuneCell
                rune={rune}
                variant="factory"
                size="large"
                showEffect={false}
              />
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
