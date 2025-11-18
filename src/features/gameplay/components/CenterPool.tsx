/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

import { useState } from 'react';
import type { Rune, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface CenterPoolProps {
  centerPool: Rune[];
  onRuneClick?: (runeType: RuneType) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
}

export function CenterPool({ 
  centerPool, 
  onRuneClick,
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn
}: CenterPoolProps) {
  const [hoveredRuneType, setHoveredRuneType] = useState<RuneType | null>(null);
  
  const handleRuneClick = (e: React.MouseEvent, runeType: RuneType) => {
    e.stopPropagation();
    if (isDraftPhase && !hasSelectedRunes && !isAITurn && onRuneClick) {
      onRuneClick(runeType);
    }
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          backgroundColor: '#dbeafe',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          alignContent: 'center',
          gap: '8px',
          maxWidth: '90%',
          border: '2px solid #bfdbfe',
          minHeight: '80px'
        }}
      >
        {centerPool.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Empty</div>
        ) : (
          centerPool.map((rune) => {
            const disabled = !isDraftPhase || hasSelectedRunes || isAITurn;
            const isHighlighted = hoveredRuneType === rune.runeType;
            
            return (
              <div
                key={rune.id}
                style={{
                  position: 'relative',
                  pointerEvents: disabled ? 'none' : 'auto',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1,
                  transform: isHighlighted ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                  filter: isHighlighted ? 'brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))' : 'none'
                }}
                onClick={(e) => handleRuneClick(e, rune.runeType)}
                onMouseEnter={() => !disabled && setHoveredRuneType(rune.runeType)}
                onMouseLeave={() => setHoveredRuneType(null)}
              >
                <RuneCell
                  rune={rune}
                  variant="center"
                  size="large"
                  showEffect={false}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
