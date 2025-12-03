/**
 * RuneforgesAndCenter component - displays runeforges and center pool
 */

import { useMemo } from 'react';
import type { GameState, Player, Runeforge as RuneforgeType, Rune, RuneType, RuneTypeCount } from '../../../../types/game';
import { getRuneTypesForCount } from '../../../../utils/gameInitialization';
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
  onCancelVoidSelection,
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
  const centerIsEmpty = centerPool.length === 0;
  const frostActive = frostEffectPending;
  const canDraftOpponentRuneforges = !frostActive && !hasAccessibleRuneforges && centerIsEmpty;
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
  const runeCounts = useMemo(() => {
    const counts: Record<RuneType, number> = { Fire: 0, Frost: 0, Life: 0, Void: 0, Wind: 0, Lightning: 0 };
    const countedIds = new Set<string>();
    const relevantRuneforges = hideOpponentRow ? playerRuneforges : runeforges;
    const centerRunesForCount = selectionFromCenter && centerSelectionOriginalRunes
      ? centerSelectionOriginalRunes
      : centerPool;

    const countRune = (rune: Rune) => {
      counts[rune.runeType] = (counts[rune.runeType] ?? 0) + 1;
      countedIds.add(rune.id);
    };

    relevantRuneforges.forEach((forge) => {
      const forgeRunes =
        draftSource?.type === 'runeforge' && draftSource.runeforgeId === forge.id && selectedRuneforgeOriginalRunes.length > 0
          ? selectedRuneforgeOriginalRunes
          : forge.runes;

      forgeRunes.forEach((rune) => {
        if (countedIds.has(rune.id)) return;
        countRune(rune);
      });
    });

    centerRunesForCount.forEach((rune) => {
      if (countedIds.has(rune.id)) return;
      countRune(rune);
    });

    selectedRunes.forEach((rune) => {
      if (countedIds.has(rune.id)) return;
      countRune(rune);
    });

    return counts;
  }, [
    centerPool,
    centerSelectionOriginalRunes,
    draftSource,
    hideOpponentRow,
    playerRuneforges,
    runeforges,
    selectedRuneforgeOriginalRunes,
    selectedRunes,
    selectionFromCenter,
  ]);

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
        onVoidRuneSelect={onVoidCenterRuneSelect}
        isDraftPhase={isDraftPhase}
        hasSelectedRunes={hasSelectedRunes}
        isAITurn={isAITurn}
        canDraftFromCenter={canDraftFromCenter}
        voidEffectPending={voidEffectPending}
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
