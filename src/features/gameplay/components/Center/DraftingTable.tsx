/**
 * RuneforgesAndCenter component - displays runeforges and center pool
 */

import { useMemo } from 'react';
import type { GameState, Player, Runeforge as RuneforgeType, Rune, RuneType } from '../../../../types/game';
import { RUNE_TYPES } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { Runeforge } from './Runeforge';
import { CenterPool } from './CenterPool';
import { RuneTypeTotals } from './RuneTypeTotals';

interface DraftingTableProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  player: Player;
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

export function DraftingTable({ 
  runeforges, 
  centerPool, 
  player,
  onRuneClick,
  onCenterRuneClick,
  isDraftPhase, 
  hasSelectedRunes,
  selectedRunes,
  draftSource,
  onCancelSelection,
  animatingRuneIds,
  hiddenCenterRuneIds
}: DraftingTableProps) {
  const hasAccessibleRuneforges = runeforges.some((forge) => forge.runes.length > 0);
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
  const runeTypes = useMemo(() => RUNE_TYPES, []);
  const runeCounts = useMemo(
    () => {
      const counts = getRuneTypeCounts({
        runeforges,
        centerPool,
        selectedRunes,
        draftSource
      });
      return counts;
    },
    [centerPool, draftSource, runeforges, selectedRunes]
  );

  const renderRuneforgeRow = (
    owner: Player,
    ownedRuneforges: RuneforgeType[],
    align: 'flex-start' | 'center' | 'flex-end',
    keySuffix: string
  ) => {
    if (ownedRuneforges.length === 0) {
      return null;
    }

    const alignClass = align === 'flex-start' ? 'items-start' : align === 'center' ? 'items-center' : 'items-end';

    return (
      <div key={`${owner.id}-${keySuffix}`} className="w-full">
        <div className={`flex flex-col ${alignClass} gap-[14px] w-full`}>
          {ownedRuneforges.map((runeforge) => (
            <Runeforge 
              key={runeforge.id} 
              runeforge={runeforge}
              onRuneClick={onRuneClick}
              disabled={hasSelectedRunes}
              displayOverride={
                selectedFromRuneforgeId === runeforge.id
                  ? {
                      runes: selectedRuneforgeOriginalRunes,
                      selectedRuneIds,
                    }
                  : undefined
              }
              selectionSourceActive={selectedFromRuneforgeId === runeforge.id && hasSelectedRunes}
              onCancelSelection={hasSelectedRunes ? onCancelSelection : undefined}
              animatingRuneIds={animatingRuneIdSet}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderCenterSection = () => (
    <div className="relative w-full flex justify-center mt-1">
      <CenterPool 
        centerPool={centerPool}
        onRuneClick={onCenterRuneClick}
        isDraftPhase={isDraftPhase}
        hasSelectedRunes={hasSelectedRunes}
        canDraftFromCenter={canDraftFromCenter}
        selectedRunes={selectionFromCenter ? selectedRunes : []}
        selectionFromCenter={Boolean(selectionFromCenter)}
        displayRunesOverride={centerSelectionOriginalRunes}
        animatingRuneIds={animatingRuneIdSet}
        hiddenRuneIds={hiddenCenterRuneIds}
      />
    </div>
  );
  
  const handleDraftingTableClick = () => {
    if (hasSelectedRunes) {
      onCancelSelection();
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center gap-4" onClick={handleDraftingTableClick}>
      <RuneTypeTotals runeTypes={runeTypes} counts={runeCounts} />
      {renderRuneforgeRow(player, runeforges, 'center', 'player')}
      {renderCenterSection()}
      
    </div>
  );
}
