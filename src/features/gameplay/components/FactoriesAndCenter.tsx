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
  
  // Split factories: first 3 for top, last 2 for sides
  const topFactories = factories.slice(0, 3);
  const leftFactory = factories[3];
  const rightFactory = factories[4];
  
  return (
    <div style={{ marginBottom: isMobile ? '16px' : '32px' }}>
      <h2 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold', marginBottom: isMobile ? '4px' : '16px', textAlign: 'center' }}>Rune Forge</h2>
      
      {/* Top 3 Factories */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '6px' : '24px', marginBottom: isMobile ? '6px' : '16px' }}>
        {topFactories.map((factory) => (
          <Factory 
            key={factory.id} 
            factory={factory}
            onDraftRune={onDraftRune}
            disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
          />
        ))}
      </div>
      
      {/* Middle Row: Left Factory, Center Pool, Right Factory */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: isMobile ? '6px' : '24px' }}>
        {/* Left Factory */}
        {leftFactory && (
          <Factory 
            key={leftFactory.id} 
            factory={leftFactory}
            onDraftRune={onDraftRune}
            disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
          />
        )}
        
        {/* Center Pool */}
        <div style={{
          backgroundColor: '#1f2937',
          borderRadius: isMobile ? '4px' : '12px',
          padding: isMobile ? '6px' : '16px',
          minWidth: isMobile ? '80px' : '300px',
          minHeight: isMobile ? '50px' : '120px',
          maxWidth: isMobile ? '200px' : '400px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)', 
            gap: isMobile ? '4px' : '8px',
            justifyContent: 'center'
          }}>
            {centerPool.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', color: '#6b7280', fontSize: isMobile ? '10px' : '14px', textAlign: 'center' }}>Empty</div>
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
                    style={{ width: isMobile ? '15px' : '20px', height: isMobile ? '15px' : '20px', objectFit: 'contain' }}
                  />
                </button>
              ))
            )}
          </div>
        </div>
        
        {/* Right Factory */}
        {rightFactory && (
          <Factory 
            key={rightFactory.id} 
            factory={rightFactory}
            onDraftRune={onDraftRune}
            disabled={!isDraftPhase || hasSelectedRunes || isAITurn}
          />
        )}
      </div>
    </div>
  );
}
