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
  frostEffectPending?: boolean;
  isFrozen?: boolean;
}

export function Factory({ factory, onFactoryClick, disabled = false, voidEffectPending = false, frostEffectPending = false, isFrozen = false }: FactoryProps) {
  const handleClick = () => {
    if (!disabled && onFactoryClick && factory.runes.length > 0) {
      onFactoryClick(factory.id);
    }
  };
  
  const isMobile = window.innerWidth < 768;
  
  // Determine styling based on state
  let backgroundColor = '#e0f2fe';
  let borderColor = '#bae6fd';
  let hoverBackgroundColor = '#bae6fd';
  let boxShadow = 'none';
  let ariaLabel = `Open factory with ${factory.runes.length} runes`;
  
  // Void effect styling (purple)
  if (voidEffectPending && factory.runes.length > 0 && !disabled) {
    backgroundColor = '#7c3aed';
    borderColor = '#6d28d9';
    hoverBackgroundColor = '#6d28d9';
    boxShadow = '0 0 12px rgba(124, 58, 237, 0.5)';
    ariaLabel = `Destroy factory with ${factory.runes.length} runes`;
  }
  
  // Frost effect styling (cyan)
  if (frostEffectPending && factory.runes.length > 0 && !disabled) {
    backgroundColor = '#06b6d4';
    borderColor = '#0891b2';
    hoverBackgroundColor = '#0891b2';
    boxShadow = '0 0 12px rgba(6, 182, 212, 0.5)';
    ariaLabel = `Freeze factory with ${factory.runes.length} runes`;
  }
  
  // Frozen state styling (icy blue with snowflakes)
  if (isFrozen && !voidEffectPending && !frostEffectPending) {
    backgroundColor = '#cffafe';
    borderColor = '#67e8f9';
    boxShadow = '0 0 16px rgba(103, 232, 249, 0.6), inset 0 0 20px rgba(165, 243, 252, 0.4)';
    ariaLabel = `Factory frozen - cannot draft`;
  }
  
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
        boxShadow: boxShadow,
        position: 'relative'
      }}
      onMouseEnter={(e) => !disabled && factory.runes.length > 0 && (e.currentTarget.style.backgroundColor = hoverBackgroundColor, e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = backgroundColor, e.currentTarget.style.transform = 'scale(1)')}
      aria-label={ariaLabel}
    >
      {/* Frozen indicator */}
      {isFrozen && !voidEffectPending && !frostEffectPending && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '2px' : '4px',
          right: isMobile ? '2px' : '4px',
          fontSize: isMobile ? '12px' : '24px',
          filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))'
        }}>
          ❄️
        </div>
      )}
      
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
                width: isMobile ? '30px' : '60px',
                height: isMobile ? '30px' : '60px',
                pointerEvents: 'none'
              }}
            >
              <RuneCell
                rune={rune}
                variant="factory"
                size="medium"
                showEffect={false}
              />
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
