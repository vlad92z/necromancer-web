/**
 * RuneforgesAndCenter component - displays runeforges and center pool
 */

import type { Runeforge as RuneforgeType, Rune, RuneType } from '../../../types/game';
import { Runeforge } from './Runeforge';
import { CenterPool } from './CenterPool';

interface RuneforgesAndCenterProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  onRuneClick: (runeforgeId: string, runeType: RuneType) => void;
  onCenterRuneClick: (runeType: RuneType) => void;
  onRuneforgeClick: (runeforgeId: string) => void;
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
  onRuneClick,
  onCenterRuneClick,
  onRuneforgeClick, 
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
            onRuneClick={onRuneClick}
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
        onRuneClick={onCenterRuneClick}
        isDraftPhase={isDraftPhase}
        hasSelectedRunes={hasSelectedRunes}
        isAITurn={isAITurn}
      />
    </div>
  );
}
