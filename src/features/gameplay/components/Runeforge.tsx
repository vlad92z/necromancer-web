/**
 * Runeforge component - displays a runeforge with runes
 * Implements Azul-style drafting: click a rune type to select all of that type
 */

import { useState } from 'react';
import type { Runeforge as RuneforgeType, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface RuneforgeProps {
  runeforge: RuneforgeType;
  onRuneClick?: (runeforgeId: string, runeType: RuneType) => void;
  onRuneforgeClick?: (runeforgeId: string) => void;
  disabled?: boolean;
  voidEffectPending?: boolean;
  frostEffectPending?: boolean;
  isFrozen?: boolean;
}

export function Runeforge({ 
  runeforge, 
  onRuneClick,
  onRuneforgeClick, 
  disabled = false, 
  voidEffectPending = false, 
  frostEffectPending = false, 
  isFrozen = false
}: RuneforgeProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  
  const handleClick = () => {
    // For Void/Frost effects, click the entire runeforge
    if (!disabled && onRuneforgeClick && runeforge.runes.length > 0 && (voidEffectPending || frostEffectPending)) {
      onRuneforgeClick(runeforge.id);
    }
  };
  
  const handleRuneClick = (e: React.MouseEvent, runeType: RuneType) => {
    e.stopPropagation();
    if (!disabled && onRuneClick && !voidEffectPending && !frostEffectPending) {
      onRuneClick(runeforge.id, runeType);
    }
  };
  
  // Determine styling based on state
  let backgroundColor = '#e0f2fe';
  let borderColor = '#bae6fd';
  let hoverBackgroundColor = '#bae6fd';
  let boxShadow = 'none';
  let ariaLabel = `Open runeforge with ${runeforge.runes.length} runes`;
  
  // Normal selectable state (green highlight when player can select)
  const isSelectable = !disabled && !voidEffectPending && !frostEffectPending && !isFrozen && runeforge.runes.length > 0 && onRuneClick;
  if (isSelectable) {
    borderColor = '#22c55e';
    boxShadow = '0 0 12px rgba(34, 197, 94, 0.5)';
  }
  
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
        minWidth: '60px',
        minHeight: '60px',
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
      onMouseEnter={(e) => {
        if (!disabled && runeforge.runes.length > 0 && onRuneforgeClick && (voidEffectPending || frostEffectPending)) {
          e.currentTarget.style.backgroundColor = hoverBackgroundColor;
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = backgroundColor;
        e.currentTarget.style.transform = 'scale(1)';
      }}
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
          {runeforge.runes.map((rune) => {
            const isHighlighted = hoveredRuneType === rune.runeType;
            
            return (
              <div
                key={rune.id}
                style={{
                  width: '60px',
                  height: '60px',
                  position: 'relative',
                  pointerEvents: (voidEffectPending || frostEffectPending || disabled) ? 'none' : 'auto',
                  cursor: (voidEffectPending || frostEffectPending || disabled) ? 'not-allowed' : 'pointer',
                  transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                  filter: isHighlighted ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none'
                }}
                onClick={(e) => handleRuneClick(e, rune.runeType)}
                onMouseEnter={() => !disabled && !voidEffectPending && !frostEffectPending && setHoveredRuneType(rune.runeType)}
                onMouseLeave={() => setHoveredRuneType(null)}
              >
                <RuneCell
                  rune={rune}
                  variant="runeforge"
                  size='large'
                  showEffect={false}
                />
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}
