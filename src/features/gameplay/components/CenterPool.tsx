/**
 * CenterPool component - displays the center pool where leftover runes accumulate
 */

import type { Rune } from '../../../types/game';
import { RuneCell } from '../../../components/RuneCell';

interface CenterPoolProps {
  centerPool: Rune[];
  onCenterClick: () => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
}

export function CenterPool({ 
  centerPool, 
  onCenterClick, 
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn 
}: CenterPoolProps) {
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <button
        onClick={onCenterClick}
        disabled={!isDraftPhase || hasSelectedRunes || isAITurn || centerPool.length === 0}
        style={{
          backgroundColor: '#dbeafe',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          maxWidth: '90%',
          border: '2px solid #bfdbfe',
          cursor: (!isDraftPhase || hasSelectedRunes || isAITurn || centerPool.length === 0) ? 'not-allowed' : 'pointer',
          outline: 'none',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => !(!isDraftPhase || hasSelectedRunes || isAITurn || centerPool.length === 0) && (e.currentTarget.style.backgroundColor = '#bfdbfe', e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe', e.currentTarget.style.transform = 'scale(1)')}
        aria-label={`Open center pool with ${centerPool.length} runes`}
      >
        {centerPool.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Empty</div>
        ) : (
          centerPool.map((rune) => (
            <div
              key={rune.id}
              style={{
                pointerEvents: 'none'
              }}
            >
              <RuneCell
                rune={rune}
                variant="center"
                size="large"
                showEffect={false}
              />
            </div>
          ))
        )}
      </button>
    </div>
  );
}
