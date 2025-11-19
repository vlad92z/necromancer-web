/**
 * RuneforgesAndCenter component - displays runeforges and center pool
 */

import type { GameState, Player, Runeforge as RuneforgeType, Rune, RuneType } from '../../../types/game';
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
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
  onCancelSelection: () => void;
  onCancelVoidSelection?: () => void;
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
  frostEffectPending,
  selectedRunes,
  draftSource,
  onCancelSelection,
  onCancelVoidSelection
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

  const selectedFromRuneforgeId = draftSource?.type === 'runeforge' ? draftSource.runeforgeId : null;
  const pendingRunesFromRuneforge = draftSource?.type === 'runeforge' ? draftSource.movedToCenter : [];
  const selectedRuneforgeOriginalRunes = draftSource?.type === 'runeforge' ? draftSource.originalRunes : [];
  const selectionFromCenter = draftSource?.type === 'center';
  const centerSelectionOriginalRunes = draftSource?.type === 'center' ? draftSource.originalRunes : undefined;
  const selectedRuneIds = selectedRunes.map((rune) => rune.id);

  const getDisabledState = (forge: RuneforgeType): boolean => {
    const selectionMatchesForge = selectedFromRuneforgeId === forge.id;
    if (frostActive && !voidEffectPending) {
      return true;
    }

    if (voidEffectPending) {
      return false;
    }

    const baseDisabled = !isDraftPhase || isAITurn;
    if (baseDisabled) {
      return true;
    }

    if (hasSelectedRunes && !selectionMatchesForge) {
      return true;
    }

    if (forge.ownerId !== currentPlayerId && !canDraftOpponentRuneforges) {
      return true;
    }

    return false;
  };

  const renderRuneforgeRow = (owner: Player, ownedRuneforges: RuneforgeType[], align: 'flex-start' | 'center' | 'flex-end') => (
    <div key={owner.id} style={{ marginBottom: '16px', width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: align, 
        gap: '60px', 
        flexWrap: 'wrap'
      }}>
        {ownedRuneforges.map((runeforge) => (
          <Runeforge 
            key={runeforge.id} 
            runeforge={runeforge}
            onRuneClick={onRuneClick}
            onVoidRuneSelect={onVoidRuneforgeRuneSelect}
            disabled={selectedFromRuneforgeId === runeforge.id && hasSelectedRunes ? false : getDisabledState(runeforge)}
            voidEffectPending={voidEffectPending}
            frostEffectPending={frostEffectPending}
            displayOverride={
              selectedFromRuneforgeId === runeforge.id
                ? {
                    runes: selectedRuneforgeOriginalRunes,
                    selectedRuneIds,
                  }
                : undefined
            }
            selectionSourceActive={selectedFromRuneforgeId === runeforge.id && hasSelectedRunes}
            onCancelSelection={selectedFromRuneforgeId === runeforge.id && hasSelectedRunes ? onCancelSelection : undefined}
          />
        ))}
      </div>
    </div>
  );
  
  return (
    <div
      style={{
        position: 'relative',
        padding: '8px 0',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {voidEffectPending && !isAITurn && onCancelVoidSelection && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            right: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '999px',
            background: 'rgba(16, 10, 32, 0.85)',
            border: '1px solid rgba(192, 132, 252, 0.4)',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.35)',
            color: '#f7f4ff',
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            zIndex: 2
          }}
        >
          <span style={{ opacity: 0.9 }}>Select a rune to destroy</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCancelVoidSelection();
            }}
            style={{
              border: 'none',
              borderRadius: '999px',
              background: '#c084fc',
              color: '#0b031c',
              fontWeight: 600,
              fontSize: '12px',
              padding: '4px 10px',
              cursor: 'pointer'
            }}
          >
            Skip
          </button>
        </div>
      )}
      {renderRuneforgeRow(opponent, opponentRuneforges, 'center')}
      <div style={{ position: 'relative', minHeight: '60px', marginBottom: '25px', marginTop: '25px', width: '100%' }}>
        <CenterPool 
          centerPool={centerPool}
          onRuneClick={onCenterRuneClick}
          onVoidRuneSelect={onVoidCenterRuneSelect}
          isDraftPhase={isDraftPhase}
          hasSelectedRunes={hasSelectedRunes}
          isAITurn={isAITurn}
          canDraftFromCenter={canDraftFromCenter}
          voidEffectPending={voidEffectPending}
          selectedRunes={selectionFromCenter ? selectedRunes : []}
          selectionFromCenter={Boolean(selectionFromCenter)}
          onCancelSelection={selectionFromCenter ? onCancelSelection : undefined}
          pendingRunesFromRuneforge={pendingRunesFromRuneforge}
          displayRunesOverride={centerSelectionOriginalRunes}
        />
      </div>

      {renderRuneforgeRow(player, playerRuneforges, 'center')}
    </div>
  );
}
