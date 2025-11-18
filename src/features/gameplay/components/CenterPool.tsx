/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

import { useState } from 'react';
import type { Rune, RuneType } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';
import { getRuneEffectDescription } from '../../../utils/runeHelpers';

interface CenterPoolProps {
  centerPool: Rune[];
  onRuneClick?: (runeType: RuneType) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
  isClassicMode?: boolean;
}

export function CenterPool({ 
  centerPool, 
  onRuneClick,
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn,
  isClassicMode = false
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
            // Count how many runes of this type are in the center pool
            const runeTypeCount = centerPool.filter(r => r.runeType === rune.runeType).length;
            const showTooltip = hoveredRuneType === rune.runeType;
            const disabled = !isDraftPhase || hasSelectedRunes || isAITurn;
            
            return (
              <div
                key={rune.id}
                style={{
                  position: 'relative',
                  pointerEvents: disabled ? 'none' : 'auto',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.5 : 1
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
                
                {/* Tooltip */}
                {showTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '8px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'normal',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    maxWidth: '200px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {runeTypeCount} {rune.runeType} rune{runeTypeCount > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>
                      {getRuneEffectDescription(rune.runeType, isClassicMode)}
                    </div>
                    {/* Arrow */}
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid #1e293b'
                    }} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
