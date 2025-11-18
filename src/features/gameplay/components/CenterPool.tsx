/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

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
