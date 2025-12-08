/**
 * DraftingTable component - displays runeforges for drafting
 */

import { useMemo } from 'react';
import type { GameState, Player, Runeforge as RuneforgeType, Rune, RuneType } from '../../../../types/game';
import { RUNE_TYPES } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { Runeforge } from './Runeforge';
import { RuneTypeTotals } from './RuneTypeTotals';

interface DraftingTableProps {
  runeforges: RuneforgeType[];
  player: Player;
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onAllRuneforgesClick: (runeType: RuneType, runeId: string) => void;
  hasSelectedRunes: boolean;
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
  onCancelSelection: () => void;
  animatingRuneIds?: string[];
  hideOpponentRow?: boolean;
}

export function DraftingTable({ 
  runeforges, 
  player,
  onRuneClick,
  onAllRuneforgesClick,
  hasSelectedRunes,
  selectedRunes,
  draftSource,
  onCancelSelection,
  animatingRuneIds
}: DraftingTableProps) {
  const allRuneforgesInactive = runeforges.length > 0 && runeforges.every((f) => f.isInactive);
  const canDraftFromAllRuneforges = allRuneforgesInactive;

  const selectedFromRuneforgeId = draftSource?.type === 'runeforge' ? draftSource.runeforgeId : null;
  const selectedRuneforgeOriginalRunes = useMemo(
    () => (draftSource?.type === 'runeforge' ? draftSource.originalRunes : []),
    [draftSource]
  );
  const selectionFromAllRuneforges = draftSource?.type === 'all-runeforges';
  const selectedRuneIds = selectedRunes.map((rune) => rune.id);
  const animatingRuneIdSet = animatingRuneIds ? new Set(animatingRuneIds) : null;
  const runeTypes = useMemo(() => RUNE_TYPES, []);
  const runeCounts = useMemo(
    () => {
      const counts = getRuneTypeCounts({
        runeforges,
        selectedRunes,
        draftSource
      });
      return counts;
    },
    [draftSource, runeforges, selectedRunes]
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
          {ownedRuneforges.map((runeforge) => {
            const isThisRuneforgeSelected = selectedFromRuneforgeId === runeforge.id;
            const displayOverride = isThisRuneforgeSelected
              ? {
                  runes: selectedRuneforgeOriginalRunes,
                  selectedRuneIds,
                }
              : selectionFromAllRuneforges && draftSource?.originalRunesByForge
              ? (() => {
                  const originalRunes = draftSource.originalRunesByForge[runeforge.id];
                  return originalRunes ? {
                    runes: originalRunes,
                    selectedRuneIds: originalRunes
                      .filter(r => selectedRuneIds.includes(r.id))
                      .map(r => r.id),
                  } : undefined;
                })()
              : undefined;

            const handleClick = canDraftFromAllRuneforges
              ? (_runeforgeId: string, runeType: RuneType, runeId: string) => onAllRuneforgesClick(runeType, runeId)
              : onRuneClick;

            return (
              <Runeforge 
                key={runeforge.id} 
                runeforge={runeforge}
                onRuneClick={handleClick}
                disabled={hasSelectedRunes}
                displayOverride={displayOverride}
                selectionSourceActive={isThisRuneforgeSelected && hasSelectedRunes}
                onCancelSelection={hasSelectedRunes ? onCancelSelection : undefined}
                animatingRuneIds={animatingRuneIdSet}
                allInactiveMode={canDraftFromAllRuneforges}
              />
            );
          })}
        </div>
      </div>
    );
  };
  
  const handleDraftingTableClick = () => {
    if (hasSelectedRunes) {
      onCancelSelection();
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-center gap-4" onClick={handleDraftingTableClick}>
      <RuneTypeTotals runeTypes={runeTypes} counts={runeCounts} />
      {renderRuneforgeRow(player, runeforges, 'center', 'player')}
    </div>
  );
}
