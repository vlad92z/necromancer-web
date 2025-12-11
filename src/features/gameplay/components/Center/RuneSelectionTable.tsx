/**
 * DraftingTable component - displays runeforges as rune rows alongside the center pool
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameState, Runeforge as RuneforgeType, Rune, RuneType } from '../../../../types/game';
import { RUNE_TYPES } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { RuneTypeTotals } from './RuneTypeTotals';
import { GameMetadataView } from './GameMetadataView';
import { Runeforge } from './Runeforge';
import type { ArtefactId } from '../../../../types/artefacts';

interface DraftingTableProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  onCenterRuneClick: (runeType: RuneType, runeId: string) => void;
  isSelectionPhase: boolean;
  hasSelectedRunes: boolean;
  selectedRunes: Rune[];
  draftSource: GameState['draftSource'];
  onCancelSelection: () => void;
  animatingRuneIds?: string[];
  hiddenCenterRuneIds?: Set<string>;
  hideOpponentRow?: boolean;
  runesPerRuneforge: number;
  runeforgeDraftStage: GameState['runeforgeDraftStage'];
  gameNumber: number;
  strainValue: number;
  arcaneDust?: number;
  activeArtefactIds: ArtefactId[];
}

export function RuneSelectionTable({ 
  runeforges, 
  centerPool, 
  onRuneClick,
  hasSelectedRunes,
  selectedRunes,
  draftSource,
  onCancelSelection,
  animatingRuneIds,
  runesPerRuneforge,
  runeforgeDraftStage,
  gameNumber,
  strainValue,
  arcaneDust,
  activeArtefactIds,
}: DraftingTableProps) {
  const [hoveredRuneTypeByRuneforge, setHoveredRuneTypeByRuneforge] = useState<Record<string, RuneType | null>>({});
  const isGlobalDraftStage = runeforgeDraftStage === 'global';
  const isGlobalSelection = draftSource?.type === 'runeforge' && draftSource.selectionMode === 'global';

  const computeGlobalHoverState = useCallback(
    (runeType: RuneType): Record<string, RuneType | null> => {
      if (!isGlobalDraftStage) {
        return {};
      }
      const hoverMap: Record<string, RuneType | null> = {};
      runeforges.forEach((runeforge) => {
        const hasRuneType = runeforge.runes.some((rune) => rune.runeType === runeType);
        hoverMap[runeforge.id] = hasRuneType ? runeType : null;
      });
      return hoverMap;
    },
    [isGlobalDraftStage, runeforges]
  );

  useEffect(() => {
    setHoveredRuneTypeByRuneforge({});
  }, [runeforgeDraftStage]);

  const selectedFromRuneforgeId = draftSource?.type === 'runeforge' ? draftSource.runeforgeId : null;
  const selectedRuneforgeOriginalRunes = useMemo(
    () => (draftSource?.type === 'runeforge' ? draftSource.originalRunes : []),
    [draftSource]
  );
  const globalSelectionOriginals = useMemo(() => {
    if (draftSource?.type !== 'runeforge' || draftSource.selectionMode !== 'global') {
      return null;
    }
    const map = new Map<string, Rune[]>();
    (draftSource.affectedRuneforges ?? []).forEach(({ runeforgeId, originalRunes }) => {
      map.set(runeforgeId, originalRunes);
    });
    return map;
  }, [draftSource]);
  const selectedRuneIdSet = useMemo(() => new Set(selectedRunes.map((rune) => rune.id)), [selectedRunes]);
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

  const handleRuneMouseEnter = (runeforgeId: string, runeType: RuneType, selectionActive: boolean, disabled: boolean) => {
    if (selectionActive || hasSelectedRunes || disabled) {
      return;
    }
    if (isGlobalDraftStage) {
      const hoverState = computeGlobalHoverState(runeType);
      setHoveredRuneTypeByRuneforge(hoverState);
      return;
    }
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: runeType }));
  };

  const handleRuneMouseLeave = (runeforgeId: string) => {
    if (isGlobalDraftStage) {
      setHoveredRuneTypeByRuneforge({});
      return;
    }
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: null }));
  };
  
  const handleDraftingTableClick = () => {
    if (hasSelectedRunes) {
      onCancelSelection();
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-start gap-4 p-[min(1.2vmin,16px)]" onClick={handleDraftingTableClick}>
      <GameMetadataView
        gameNumber={gameNumber}
        strainValue={strainValue}
        arcaneDust={arcaneDust}
        activeArtefactIds={activeArtefactIds}
      />
      <div className="flex-1 flex flex-col items-center justify-center gap-[14px] w-full">
        {runeforges.map((runeforge) => (
          <Runeforge
            key={runeforge.id}
            runeforge={runeforge}
            runesPerRuneforge={runesPerRuneforge}
            hoveredRuneType={hoveredRuneTypeByRuneforge[runeforge.id] ?? null}
            hasSelectedRunes={hasSelectedRunes}
            isGlobalSelection={isGlobalSelection}
            selectedFromRuneforgeId={selectedFromRuneforgeId}
            selectedRuneforgeOriginalRunes={selectedRuneforgeOriginalRunes}
            globalSelectionOriginals={globalSelectionOriginals}
            selectedRuneIdSet={selectedRuneIdSet}
            animatingRuneIdSet={animatingRuneIdSet}
            onRuneClick={onRuneClick}
            onRuneMouseEnter={handleRuneMouseEnter}
            onRuneMouseLeave={handleRuneMouseLeave}
          />
        ))}
      </div>
      <RuneTypeTotals runeTypes={runeTypes} counts={runeCounts} />
    </div>
  );
}
