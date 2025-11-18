/**
 * RuneforgesAndCenter component - displays runeforges and center pool
 */

import type { Runeforge as RuneforgeType, Rune } from '../../../types/game';
import { Runeforge } from './Runeforge';
import { CenterPool } from './CenterPool';

interface RuneforgesAndCenterProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  onRuneforgeClick: (runeforgeId: string) => void;
  onCenterClick: () => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
  voidEffectPending: boolean;
  frostEffectPending: boolean;
  frozenRuneforges: string[];
}

export function RuneforgesAndCenter({ 
  runeforges, 
  centerPool, 
  onRuneforgeClick, 
  onCenterClick, 
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn,
  voidEffectPending,
  frostEffectPending,
  frozenRuneforges
}: RuneforgesAndCenterProps) {
  
  return (
    <div>
      
      {/* Runeforges  */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '24px', 
        marginBottom: '24px' 
      }}>
        {runeforges.map((runeforge) => (
          <Runeforge 
            key={runeforge.id} 
            runeforge={runeforge}
            onRuneforgeClick={onRuneforgeClick}
            disabled={(voidEffectPending || frostEffectPending) ? isAITurn : (!isDraftPhase || hasSelectedRunes || isAITurn || frozenRuneforges.includes(runeforge.id))}
            voidEffectPending={voidEffectPending}
            frostEffectPending={frostEffectPending}
            isFrozen={frozenRuneforges.includes(runeforge.id)}
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
