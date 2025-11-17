/**
 * FactoriesAndCenter component - displays factories and center pool
 */

import type { Factory as FactoryType, Rune } from '../../../types/game';
import { Factory } from './Factory';
import { CenterPool } from './CenterPool';

interface FactoriesAndCenterProps {
  factories: FactoryType[];
  centerPool: Rune[];
  onFactoryClick: (factoryId: string) => void;
  onCenterClick: () => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
  voidEffectPending: boolean;
  frostEffectPending: boolean;
  frozenFactories: string[];
}

export function FactoriesAndCenter({ 
  factories, 
  centerPool, 
  onFactoryClick, 
  onCenterClick, 
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn,
  voidEffectPending,
  frostEffectPending,
  frozenFactories
}: FactoriesAndCenterProps) {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{ marginBottom: isMobile ? '16px' : '32px' }}>
      
      {/* Factories - Single row for both mobile and desktop */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: isMobile ? '6px' : '24px', 
        marginBottom: isMobile ? '8px' : '24px' 
      }}>
        {factories.map((factory) => (
          <Factory 
            key={factory.id} 
            factory={factory}
            onFactoryClick={onFactoryClick}
            disabled={(voidEffectPending || frostEffectPending) ? isAITurn : (!isDraftPhase || hasSelectedRunes || isAITurn || frozenFactories.includes(factory.id))}
            voidEffectPending={voidEffectPending}
            frostEffectPending={frostEffectPending}
            isFrozen={frozenFactories.includes(factory.id)}
          />
        ))}
      </div>
      
      {/* Center Pool */}
      <CenterPool 
        centerPool={centerPool}
        onCenterClick={onCenterClick}
        isDraftPhase={isDraftPhase}
        hasSelectedRunes={hasSelectedRunes}
        isAITurn={isAITurn}
      />
    </div>
  );
}
