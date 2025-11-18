/**
 * Runeforge component - displays a runeforge with runes
 * Implements Azul-style drafting: click a rune type to select all of that type
 */

import type { Runeforge as RuneforgeType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface RuneforgeProps {
  runeforge: RuneforgeType;
  onRuneforgeClick?: (runeforgeId: string) => void;
  disabled?: boolean;
  voidEffectPending?: boolean;
  frostEffectPending?: boolean;
  isFrozen?: boolean;
}

export function Runeforge({ runeforge, onRuneforgeClick, disabled = false, voidEffectPending = false, frostEffectPending = false, isFrozen = false }: RuneforgeProps) {
  const handleClick = () => {
    if (!disabled && onRuneforgeClick && runeforge.runes.length > 0) {
      onRuneforgeClick(runeforge.id);
    }
  };
  
  // Determine styling based on state
  let backgroundColor = '#e0f2fe';
  let borderColor = '#bae6fd';
  let hoverBackgroundColor = '#bae6fd';
  let boxShadow = 'none';
  let ariaLabel = `Open runeforge with ${runeforge.runes.length} runes`;
  
  // Void effect styling (purple)
  if (voidEffectPending && runeforge.runes.length > 0 && !disabled) {
    backgroundColor = '#7c3aed';
    borderColor = '#6d28d9';
    hoverBackgroundColor = '#6d28d9';
    boxShadow = '0 0 12px rgba(124, 58, 237, 0.5)';
    ariaLabel = `Destroy runeforge with ${runeforge.runes.length} runes`;
  }
  
  // Frost effect styling (cyan)
  if (frostEffectPending && runeforge.runes.length > 0 && !disabled) {
    backgroundColor = '#06b6d4';
    borderColor = '#0891b2';
    hoverBackgroundColor = '#0891b2';
    boxShadow = '0 0 12px rgba(6, 182, 212, 0.5)';
    ariaLabel = `Freeze runeforge with ${runeforge.runes.length} runes`;
  }
  
  // Frozen state styling (icy blue with snowflakes)
  if (isFrozen && !voidEffectPending && !frostEffectPending) {
    backgroundColor = '#cffafe';
    borderColor = '#67e8f9';
    boxShadow = '0 0 16px rgba(103, 232, 249, 0.6), inset 0 0 20px rgba(165, 243, 252, 0.4)';
    ariaLabel = `Runeforge frozen - cannot draft`;
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled || runeforge.runes.length === 0}
      style={{
        backgroundColor: backgroundColor,
        borderRadius: '12px',
        padding: '16px',
        minWidth: '120px',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        border: `2px solid ${borderColor}`,
        cursor: (disabled || runeforge.runes.length === 0) ? 'not-allowed' : 'pointer',
        outline: 'none',
        boxShadow: boxShadow,
        position: 'relative'
      }}
      onMouseEnter={(e) => !disabled && runeforge.runes.length > 0 && (e.currentTarget.style.backgroundColor = hoverBackgroundColor, e.currentTarget.style.transform = 'scale(1.02)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = backgroundColor, e.currentTarget.style.transform = 'scale(1)')}
      aria-label={ariaLabel}
    >
      {/* Frozen indicator */}
      {isFrozen && !voidEffectPending && !frostEffectPending && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          fontSize: '24px',
          filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8))'
        }}>
          ❄️
        </div>
      )}
      
      {runeforge.runes.length === 0 ? (
        <div style={{ color: '#64748b', fontSize: '14px' }}>
          Empty
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {runeforge.runes.map((rune) => (
            <div
              key={rune.id}
              style={{
                width: '60px',
                height: '60px',
                pointerEvents: 'none'
              }}
            >
              <RuneCell
                rune={rune}
                variant="runeforge"
                size='large'
                showEffect={false}
              />
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
