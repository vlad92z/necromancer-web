/**
 * RuneforgesAndCenter component - displays runeforges and center pool
 */

import type { Player, Runeforge as RuneforgeType, Rune, RuneType } from '../../../types/game';
import { Runeforge } from './Runeforge';
import { CenterPool } from './CenterPool';

interface RuneforgesAndCenterProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  players: [Player, Player];
  currentPlayerId: Player['id'];
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
  players,
  currentPlayerId,
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
  const [player, opponent] = players;
  const playerRuneforges = runeforges.filter((forge) => forge.ownerId === player.id);
  const opponentRuneforges = runeforges.filter((forge) => forge.ownerId === opponent.id);
  const currentPlayerRuneforges = runeforges.filter((forge) => forge.ownerId === currentPlayerId);
  const hasAccessibleRuneforges = currentPlayerRuneforges.some(
    (forge) => forge.runes.length > 0 && !frozenRuneforges.includes(forge.id)
  );
  const centerIsEmpty = centerPool.length === 0;
  const effectActive = voidEffectPending || frostEffectPending;
  const canDraftOpponentRuneforges = !effectActive && !hasAccessibleRuneforges && centerIsEmpty;
  const canDraftFromCenter = !hasAccessibleRuneforges;
  const centerDraftBlocked = !canDraftFromCenter && !effectActive && centerPool.length > 0 && isDraftPhase && !hasSelectedRunes && !isAITurn;

  const getDisabledState = (forge: RuneforgeType): boolean => {
    if (effectActive) {
      if (isAITurn) {
        return true;
      }
      if (frostEffectPending && forge.ownerId === currentPlayerId) {
        return true;
      }
      return false;
    }

    const baseDisabled = !isDraftPhase || hasSelectedRunes || isAITurn || frozenRuneforges.includes(forge.id);
    if (baseDisabled) {
      return true;
    }

    if (forge.ownerId !== currentPlayerId && !canDraftOpponentRuneforges) {
      return true;
    }

    return false;
  };

  const renderRuneforgeRow = (owner: Player, ownedRuneforges: RuneforgeType[], align: 'flex-start' | 'center' | 'flex-end') => (
    <div key={owner.id} style={{ marginBottom: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: align, 
        gap: '16px', 
        flexWrap: 'wrap'
      }}>
        {ownedRuneforges.map((runeforge) => (
          <Runeforge 
            key={runeforge.id} 
            runeforge={runeforge}
            onRuneClick={onRuneClick}
            onRuneforgeClick={onRuneforgeClick}
            disabled={getDisabledState(runeforge)}
            voidEffectPending={voidEffectPending}
            frostEffectPending={frostEffectPending}
            isFrozen={frozenRuneforges.includes(runeforge.id)}
          />
        ))}
      </div>
    </div>
  );
  
  return (
    <div style={{ position: 'relative', padding: '8px 0 24px' }}>
      {renderRuneforgeRow(opponent, opponentRuneforges, 'center')}

      {canDraftOpponentRuneforges && !isAITurn && (
        <div style={{
          textAlign: 'center',
          marginBottom: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          fontWeight: 600,
          position: 'relative',
          zIndex: 2
        }}>
          No personal runeforges remain and the center is empty. You may draft from your opponent's forges.
        </div>
      )}
      
      <div style={{ position: 'relative', minHeight: '60px', marginBottom: '12px' }}>
        <CenterPool 
          centerPool={centerPool}
          onRuneClick={onCenterRuneClick}
          isDraftPhase={isDraftPhase}
          hasSelectedRunes={hasSelectedRunes}
          isAITurn={isAITurn}
          canDraftFromCenter={canDraftFromCenter}
        />
      </div>

      {renderRuneforgeRow(player, playerRuneforges, 'center')}
    </div>
  );
}
