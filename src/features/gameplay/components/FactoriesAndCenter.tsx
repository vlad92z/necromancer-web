/**
 * FactoriesAndCenter component - displays factories and center pool
 */

import type { Factory as FactoryType, Rune, RuneType } from '../../../types/game';
import { Factory } from './Factory';
import fireRune from '../../../assets/runes/fire_rune.svg';
import frostRune from '../../../assets/runes/frost_rune.svg';
import poisonRune from '../../../assets/runes/poison_rune.svg';
import voidRune from '../../../assets/runes/void_rune.svg';
import windRune from '../../../assets/runes/wind_rune.svg';

const RUNE_ASSETS = {
  Fire: fireRune,
  Frost: frostRune,
  Poison: poisonRune,
  Void: voidRune,
  Wind: windRune,
};

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
      
      {/* Factories - 2 rows on mobile (3+2), single row on desktop */}
      {isMobile ? (
        <div style={{ marginBottom: '8px' }}>
          {/* First row: 3 factories */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            {factories.slice(0, 3).map((factory) => (
              <Factory 
                key={factory.id} 
                factory={factory}
                onDraftRune={onDraftRune}
                disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
              />
            ))}
          </div>
          {/* Second row: 2 factories */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            {factories.slice(3, 5).map((factory) => (
              <Factory 
                key={factory.id} 
                factory={factory}
                onDraftRune={onDraftRune}
                disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Desktop: All 5 Factories in a Row */
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
          {factories.map((factory) => (
            <Factory 
              key={factory.id} 
              factory={factory}
              onDraftRune={onDraftRune}
              disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
            />
          ))}
        </div>
      )}
      
      {/* Center Pool - Single Row */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          backgroundColor: '#dbeafe',
          borderRadius: isMobile ? '4px' : '12px',
          padding: isMobile ? '6px' : '16px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: isMobile ? '4px' : '8px',
          maxWidth: '90%'
        }}>
          {centerPool.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: isMobile ? '10px' : '14px', textAlign: 'center', padding: isMobile ? '8px' : '16px' }}>Empty</div>
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
                <img 
                  src={RUNE_ASSETS[rune.runeType]} 
                  alt={`${rune.runeType} rune`}
                  style={{ width: isMobile ? '40px' : '40px', height: isMobile ? '40px' : '40px', objectFit: 'contain' }}
                />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
