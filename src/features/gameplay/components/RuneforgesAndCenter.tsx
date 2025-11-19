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
  onVoidRuneforgeRuneSelect: (runeforgeId: string, runeId: string) => void;
  onVoidCenterRuneSelect: (runeId: string) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  isAITurn: boolean;
  voidEffectPending: boolean;
  frostEffectPending: boolean;
}

export function RuneforgesAndCenter({ 
  runeforges, 
  centerPool, 
  players,
  currentPlayerId,
  onRuneClick,
  onCenterRuneClick,
  onVoidRuneforgeRuneSelect,
  onVoidCenterRuneSelect,
  isDraftPhase, 
  hasSelectedRunes, 
  isAITurn,
  voidEffectPending,
  frostEffectPending
}: RuneforgesAndCenterProps) {
  const [player, opponent] = players;
  const playerRuneforges = runeforges.filter((forge) => forge.ownerId === player.id);
  const opponentRuneforges = runeforges.filter((forge) => forge.ownerId === opponent.id);
  const currentPlayerRuneforges = runeforges.filter((forge) => forge.ownerId === currentPlayerId);
  const hasAccessibleRuneforges = currentPlayerRuneforges.some(
    (forge) => forge.runes.length > 0
  );
  const centerIsEmpty = centerPool.length === 0;
  const frostActive = frostEffectPending;
  const canDraftOpponentRuneforges = !frostActive && !hasAccessibleRuneforges && centerIsEmpty;
  const canDraftFromCenter = !hasAccessibleRuneforges;

  const getDisabledState = (forge: RuneforgeType): boolean => {
    if (frostActive && !voidEffectPending) {
      return true;
    }

    if (voidEffectPending) {
      return false;
    }

    const baseDisabled = !isDraftPhase || hasSelectedRunes || isAITurn;
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
            onVoidRuneSelect={onVoidRuneforgeRuneSelect}
            disabled={getDisabledState(runeforge)}
            voidEffectPending={voidEffectPending}
            frostEffectPending={frostEffectPending}
          />
        ))}
      </div>
    </div>
  );
  
  return (
    <div style={{ position: 'relative', padding: '8px 0 24px' }}>
      {renderRuneforgeRow(opponent, opponentRuneforges, 'center')}
      <div style={{ position: 'relative', minHeight: '60px', marginBottom: '12px' }}>
        <CenterPool 
          centerPool={centerPool}
          onRuneClick={onCenterRuneClick}
          onVoidRuneSelect={onVoidCenterRuneSelect}
          isDraftPhase={isDraftPhase}
          hasSelectedRunes={hasSelectedRunes}
          isAITurn={isAITurn}
          canDraftFromCenter={canDraftFromCenter}
          voidEffectPending={voidEffectPending}
        />
      </div>

      {renderRuneforgeRow(player, playerRuneforges, 'center')}
    </div>
  );
}
