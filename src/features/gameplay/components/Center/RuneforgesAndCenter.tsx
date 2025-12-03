/**
 * RuneforgesAndCenter component - displays runeforges and center pool
 */

import { useMemo } from 'react';
import type { GameState, Player, Runeforge as RuneforgeType, Rune, RuneType, RuneTypeCount } from '../../../../types/game';
import { getRuneTypesForCount } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { Runeforge } from './Runeforge';
import { CenterPool } from './CenterPool';
import { RuneTypeTotals } from './RuneTypeTotals';

interface RuneforgesAndCenterProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  runeTypeCount: RuneTypeCount;
  players: [Player, Player];
  currentPlayerId: Player['id'];
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onCenterRuneClick: (runeType: RuneType, runeId: string) => void;
  isDraftPhase: boolean;
  hasSelectedRunes: boolean;
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
  onCancelSelection: () => void;
  animatingRuneIds?: string[];
  hiddenCenterRuneIds?: Set<string>;
  hideOpponentRow?: boolean;
}

export function RuneforgesAndCenter({ 
  runeforges, 
  centerPool, 
  runeTypeCount,
  players,
  currentPlayerId,
  onRuneClick,
  onCenterRuneClick,
  isDraftPhase, 
  hasSelectedRunes,
  selectedRunes,
  draftSource,
  onCancelSelection,
  animatingRuneIds,
  hiddenCenterRuneIds,
  hideOpponentRow = false
}: RuneforgesAndCenterProps) {
  const [player, opponent] = players;
  const playerRuneforges = runeforges.filter((forge) => forge.ownerId === player.id);
  const opponentRuneforges = runeforges.filter((forge) => forge.ownerId === opponent.id);
  const currentPlayerRuneforges = runeforges.filter((forge) => forge.ownerId === currentPlayerId);
  const hasAccessibleRuneforges = currentPlayerRuneforges.some(
    (forge) => forge.runes.length > 0
  );
  const canDraftFromCenter = !hasAccessibleRuneforges;

  const selectedFromRuneforgeId = draftSource?.type === 'runeforge' ? draftSource.runeforgeId : null;
  const selectedRuneforgeOriginalRunes = useMemo(
    () => (draftSource?.type === 'runeforge' ? draftSource.originalRunes : []),
    [draftSource]
  );
  const selectionFromCenter = draftSource?.type === 'center';
  const centerSelectionOriginalRunes = draftSource?.type === 'center' ? draftSource.originalRunes : undefined;
  const selectedRuneIds = selectedRunes.map((rune) => rune.id);
  const animatingRuneIdSet = animatingRuneIds ? new Set(animatingRuneIds) : null;
  const runeTypes = useMemo(() => getRuneTypesForCount(runeTypeCount), [runeTypeCount]);
  const runeCounts = useMemo(
    () =>
      getRuneTypeCounts({
        runeforges,
        playerRuneforges,
        centerPool,
        selectedRunes,
        draftSource,
        hideOpponentRow,
      }),
    [centerPool, draftSource, hideOpponentRow, playerRuneforges, runeforges, selectedRunes]
  );

  const getDisabledState = (forge: RuneforgeType): boolean => {
    const selectionMatchesForge = selectedFromRuneforgeId === forge.id;


    const baseDisabled = !isDraftPhase;
    if (baseDisabled) {
      return true;
    }

    if (hasSelectedRunes && !selectionMatchesForge) {
      return true;
    }

    if (forge.ownerId !== currentPlayerId) {
      return true;
    }

    return false;
  };

  const renderRuneforgeRow = (
    owner: Player,
    ownedRuneforges: RuneforgeType[],
    align: 'flex-start' | 'center' | 'flex-end',
    keySuffix: string
  ) => {
    if (ownedRuneforges.length === 0) {
      return null;
    }

    return (
      <div key={`${owner.id}-${keySuffix}`} style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: align,
          gap: '14px',
          width: '100%'
        }}>
          {ownedRuneforges.map((runeforge) => (
            <Runeforge 
              key={runeforge.id} 
              runeforge={runeforge}
              onRuneClick={onRuneClick}
              disabled={selectedFromRuneforgeId === runeforge.id && hasSelectedRunes ? false : getDisabledState(runeforge)}
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
              animatingRuneIds={animatingRuneIdSet}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderCenterSection = () => (
    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
      <CenterPool 
        centerPool={centerPool}
        onRuneClick={onCenterRuneClick}
        isDraftPhase={isDraftPhase}
        hasSelectedRunes={hasSelectedRunes}
        canDraftFromCenter={canDraftFromCenter}
        selectedRunes={selectionFromCenter ? selectedRunes : []}
        selectionFromCenter={Boolean(selectionFromCenter)}
        onCancelSelection={selectionFromCenter ? onCancelSelection : undefined}
        displayRunesOverride={centerSelectionOriginalRunes}
        animatingRuneIds={animatingRuneIdSet}
        hiddenRuneIds={hiddenCenterRuneIds}
      />
    </div>
  );

  const renderSoloRuneforges = () => (
    <>
      {renderRuneforgeRow(player, playerRuneforges, 'center', 'player')}
      {renderCenterSection()}
      <RuneTypeTotals runeTypes={runeTypes} counts={runeCounts} />
    </>
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
        alignItems: 'stretch',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {hideOpponentRow ? (
          renderSoloRuneforges()
        ) : (
          <>
            {renderRuneforgeRow(opponent, opponentRuneforges, 'center', 'opponent')}
            {renderRuneforgeRow(player, playerRuneforges, 'center', 'player')}
            {renderCenterSection()}
          </>
        )}
      </div>
    </div>
  );
}
