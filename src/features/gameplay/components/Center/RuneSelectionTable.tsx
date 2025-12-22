/**
 * DraftingTable component - displays runeforges as rune rows alongside the center pool
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DraftSource, GameState, Runeforge as RuneforgeType, Rune, RuneType } from '../../../../types/game';
import { RUNE_TYPES } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { RuneTypeTotals } from './RuneTypeTotals';
import { Runeforge } from './Runeforge';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
import { ArtefactsRow } from '../../../../components/ArtefactsRow';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { useArtefactStore } from '../../../../state/stores/artefactStore';
import type { ActiveElement } from '../keyboardNavigation';

interface RuneSelectionTableProps {
  runeforges: RuneforgeType[];
  centerPool: Rune[];
  onRuneClick: (runeforgeId: string, runeType: RuneType, runeId: string) => void;
  hasSelectedRunes: boolean;
  selectedRunes: Rune[];
  draftSource: DraftSource | null;
  activeElement: ActiveElement | null;
  onCancelSelection: () => void;
  animatingRuneIds?: string[];
  hideOpponentRow?: boolean;
  runesPerRuneforge: number;
  runeforgeDraftStage: GameState['runeforgeDraftStage'];
}

export function RuneSelectionTable({
  runeforges,
  centerPool,
  onRuneClick,
  hasSelectedRunes,
  selectedRunes,
  draftSource,
  activeElement,
  onCancelSelection,
  animatingRuneIds,
  runesPerRuneforge,
  runeforgeDraftStage,
}: RuneSelectionTableProps) {
  const [hoveredRuneTypeByRuneforge, setHoveredRuneTypeByRuneforge] = useState<Record<string, RuneType | null>>({});
  const isGlobalDraftStage = runeforgeDraftStage === 'global';
  const isGlobalSelection = draftSource?.type === 'runeforge' && draftSource.selectionMode === 'global';
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);

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

  const computeSelectionRunes = useCallback(
    (runeforgeId: string, runeType: RuneType): Rune[] => {
      if (isGlobalDraftStage) {
        return runeforges
          .filter((forge) => !(forge.disabled ?? false))
          .flatMap((forge) => forge.runes.filter((rune) => rune.runeType === runeType));
      }

      const runeforge = runeforges.find((forge) => forge.id === runeforgeId);
      if (!runeforge || runeforge.disabled) {
        return [];
      }

      return runeforge.runes.filter((rune) => rune.runeType === runeType);
    },
    [isGlobalDraftStage, runeforges]
  );

  const handleRuneMouseEnter = (
    runeforgeId: string,
    runeType: RuneType,
    runeId: string,
    selectionActive: boolean,
    disabled: boolean
  ) => {
    if (selectionActive || hasSelectedRunes || disabled) {
      resetTooltipCards();
      return;
    }

    const selectionRunes = computeSelectionRunes(runeforgeId, runeType);
    if (selectionRunes.length > 0) {
      setTooltipCards(buildRuneTooltipCards(selectionRunes, runeId));
    } else {
      resetTooltipCards();
    }

    if (isGlobalDraftStage) {
      const hoverState = computeGlobalHoverState(runeType);
      setHoveredRuneTypeByRuneforge(hoverState);
      return;
    }
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: runeType }));
  };

  const handleRuneMouseLeave = (runeforgeId: string) => {
    resetTooltipCards();
    if (isGlobalDraftStage) {
      setHoveredRuneTypeByRuneforge({});
      return;
    }
    setHoveredRuneTypeByRuneforge((prev) => ({ ...prev, [runeforgeId]: null }));
  };
  
  const selectedArtefactIds = useArtefactStore((state) => state.selectedArtefactIds);

  const handleDraftingTableClick = () => {
    if (hasSelectedRunes) {
      onCancelSelection();
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-start gap-4 p-[min(1.2vmin,16px)]" onClick={handleDraftingTableClick}>
      <div className="flex-1 flex flex-col gap-[14px] w-full">
        {runeforges.map((runeforge, runeforgeIndex) => (
          <Runeforge
            key={runeforge.id}
            runeforgeIndex={runeforgeIndex}
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
            activeElement={activeElement}
            onRuneClick={onRuneClick}
            onRuneMouseEnter={handleRuneMouseEnter}
            onRuneMouseLeave={handleRuneMouseLeave}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <RuneTypeTotals runeTypes={runeTypes} counts={runeCounts} />
        <ArtefactsRow selectedArtefactIds={selectedArtefactIds} compact />
      </div>
    </div>
  );
}
