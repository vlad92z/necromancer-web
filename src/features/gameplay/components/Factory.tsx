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
  voidEffectPending?: boolean;
}

export function Factory({ factory, onFactoryClick, disabled = false, voidEffectPending = false }: FactoryProps) {
  const handleClick = () => {
    if (!disabled && onFactoryClick && factory.runes.length > 0) {
      onFactoryClick(factory.id);
    }
  };
  
  const isMobile = window.innerWidth < 768;
  
  // Void effect styling
  const isVoidTarget = voidEffectPending && factory.runes.length > 0 && !disabled;
  const backgroundColor = isVoidTarget ? '#7c3aed' : '#e0f2fe';
  const borderColor = isVoidTarget ? '#6d28d9' : '#bae6fd';
  const hoverBackgroundColor = isVoidTarget ? '#6d28d9' : '#bae6fd';
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled || factory.runes.length === 0}
      style={{
        backgroundColor: backgroundColor,
        borderRadius: isMobile ? '4px' : '12px',
        padding: isMobile ? '6px' : '16px',
        minWidth: isMobile ? '50px' : '120px',
        minHeight: isMobile ? '50px' : '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        border: `2px solid ${borderColor}`,
        cursor: (disabled || factory.runes.length === 0) ? 'not-allowed' : 'pointer',
        outline: 'none',
        boxShadow: isVoidTarget ? '0 0 12px rgba(124, 58, 237, 0.5)' : 'none'
      }}
      onMouseEnter={(e) => !disabled && factory.runes.length > 0 && (e.currentTarget.style.backgroundColor = hoverBackgroundColor, e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = backgroundColor, e.currentTarget.style.transform = 'scale(1)')}
      aria-label={isVoidTarget ? `Destroy factory with ${factory.runes.length} runes` : `Open factory with ${factory.runes.length} runes`}
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
