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
    // Use a dark purple glow instead of changing the background
    borderColor = '#6d28d9';
    hoverBackgroundColor = '#e0f2fe';
    boxShadow = '0 6px 24px rgba(99, 102, 241, 0.9), inset 0 0 8px rgba(124, 58, 237, 0.25)';
    ariaLabel = `Destroy runeforge with ${runeforge.runes.length} runes`;
  }
  
  // Frost effect styling (cyan)
  if (frostEffectPending && runeforge.runes.length > 0 && !disabled) {
    // Use a dark blue glow instead of changing the background
    borderColor = '#0891b2';
    hoverBackgroundColor = '#e0f2fe';
    boxShadow = '0 6px 24px rgba(2, 132, 199, 0.9), inset 0 0 8px rgba(6, 182, 212, 0.15)';
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
        borderRadius: '50%',
        width: '140px',
        height: '140px',
        padding: '8px',
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
          if (voidEffectPending) {
            e.currentTarget.style.boxShadow = '0 10px 32px rgba(99, 102, 241, 1), inset 0 0 10px rgba(124, 58, 237, 0.35)';
          } else if (frostEffectPending) {
            e.currentTarget.style.boxShadow = '0 10px 32px rgba(3, 105, 161, 1), inset 0 0 10px rgba(6, 182, 212, 0.25)';
          } else {
            e.currentTarget.style.backgroundColor = hoverBackgroundColor;
          }
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = backgroundColor;
        e.currentTarget.style.boxShadow = boxShadow;
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
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {runeforge.runes.map((rune, idx) => {
            const isHighlighted = hoveredRuneType === rune.runeType;

            // Diamond positions: top, right, bottom, left
            const positions: Array<React.CSSProperties> = [
              { top: '8%', left: '50%', transform: 'translate(-50%, -25%)' }, // top
              { top: '50%', left: '92%', transform: 'translate(-75%, -50%)' }, // right
              { top: '92%', left: '50%', transform: 'translate(-50%, -75%)' }, // bottom
              { top: '50%', left: '8%', transform: 'translate(-25%, -50%)' }  // left
            ];

            const pos = positions[idx % 4];
            const baseSize = 56;
            const baseTransform = `${pos.transform} ${isHighlighted ? 'scale(1.1)' : 'scale(1)'} `;

            return (
              <div
                key={rune.id}
                style={{
                  width: `${baseSize}px`,
                  height: `${baseSize}px`,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: (voidEffectPending || frostEffectPending || disabled) ? 'none' : 'auto',
                  cursor: (voidEffectPending || frostEffectPending || disabled) ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.15s ease',
                  filter: isHighlighted ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none',
                  ...pos,
                  transform: baseTransform
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
