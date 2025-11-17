/**
 * FactoriesAndCenter component - displays factories and center pool
 */

import type { Factory as FactoryType, Rune, RuneType } from '../../../types/game';
import { Factory } from './Factory';
import { CenterPool } from './CenterPool';

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
      
      {/* Center Pool */}
      <CenterPool 
        centerPool={centerPool}
        onDraftFromCenter={onDraftFromCenter}
        isDraftPhase={isDraftPhase}
        hasSelectedRunes={hasSelectedRunes}
        isAITurn={isAITurn}
      />
    </div>
  );
}
