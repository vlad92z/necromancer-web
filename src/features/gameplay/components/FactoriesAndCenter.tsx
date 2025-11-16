/**
 * FactoriesAndCenter component - displays factories and center pool
 */

import type { Factory as FactoryType, Rune, RuneType } from '../../../types/game';
import { Factory } from './Factory';
import { RuneToken } from '../../../components/RuneToken';

interface FactoriesAndCenterProps {
  factories: FactoryType[];
  centerPool: Rune[];
  onDraftRune: (factoryId: string, runeType: RuneType) => void;
  onDraftFromCenter: (runeType: RuneType) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
}

export function FactoriesAndCenter({ 
  factories, 
  centerPool, 
  onDraftRune, 
  onDraftFromCenter, 
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn 
}: FactoriesAndCenterProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ marginBottom: isMobile ? '16px' : '32px' }}>
      <h2 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold', marginBottom: isMobile ? '4px' : '16px', textAlign: 'center' }}>Factories</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '6px' : '24px', marginBottom: isMobile ? '6px' : '24px', maxWidth: '72rem', margin: isMobile ? '0 auto 6px' : '0 auto 24px' }}>
        {factories.map((factory) => (
          <Factory 
            key={factory.id} 
            factory={factory}
            onDraftRune={onDraftRune}
            disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
          />
        ))}
      </div>
      
      {/* Center Pool */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: isMobile ? '4px' : '12px',
          padding: isMobile ? '6px' : '16px',
          minWidth: isMobile ? '80px' : '200px',
          minHeight: isMobile ? '50px' : '120px',
          width: isMobile ? '100%' : 'auto'
        }}>
          <h3 style={{ fontSize: isMobile ? '6px' : '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px', textAlign: 'center' }}>
            Center Pool
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {centerPool.length === 0 ? (
              <div style={{ color: '#6b7280', fontSize: '14px' }}>Empty</div>
            ) : (
              centerPool.map((rune) => (
                <button
                  key={rune.id}
                  onClick={() => onDraftFromCenter(rune.runeType)}
                  disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
                  style={{
                    outline: 'none',
                    border: 'none',
                    background: 'transparent',
                    borderRadius: '8px',
                    cursor: (!isDraftPhase || hasSelectedRunes || isAITurn) ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s',
                    padding: 0
                  }}
                  onMouseEnter={(e) => !(!isDraftPhase || hasSelectedRunes || isAITurn) && (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  aria-label={`Select ${rune.runeType} runes from center`}
                >
                  <RuneToken rune={rune} size="small" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
