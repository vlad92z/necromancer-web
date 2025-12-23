/**
 * DraftingTable component - displays runeforges as rune rows alongside the center pool
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Rune, RuneType } from '../../../../types/game';
import { RUNE_TYPES } from '../../../../utils/gameInitialization';
import { getRuneTypeCounts } from '../../../../utils/runeCounting';
import { RuneTypeTotals } from './RuneTypeTotals';
import { RuneforgeView } from './RuneforgeView';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
import { ArtefactsRow } from '../../../../components/ArtefactsRow';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { useArtefactStore } from '../../../../state/stores/artefactStore';
import { useSelectionStore } from '../../../../state/stores';
import { useUIStore } from '../../../../state/stores/uiStore';

interface RuneSelectionTableProps {
  hideOpponentRow?: boolean;
}

export function RuneSelectionTable({
}: RuneSelectionTableProps) {
  const draftStage = useGameplayStore((state) => state.runeforgeDraftStage);
  const runeforges = useGameplayStore((state) => state.runeforges);
  const cancelSelection = useGameplayStore((state) => state.cancelSelection);
  const selectedRunes = useSelectionStore((state) => state.selectedRunes);
  const hasSelectedRunes = selectedRunes.length > 0;  
  const [hoveredRuneTypeByRuneforge, setHoveredRuneTypeByRuneforge] = useState<Record<string, RuneType | null>>({});
  const isGlobalDraftStage = draftStage === 'global';
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const animatingRuneIdSet = useUIStore((state) => state.animatingRuneIds);
  const isPlacementAnimating = useUIStore((state) => state.isPlacementAnimating);

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
  }, [draftStage]);

  const runeTypes = useMemo(() => RUNE_TYPES, []);
  const runeCounts = useMemo(
    () => {
      const counts = getRuneTypeCounts({
        runeforges,
        selectedRunes,
      });
      return counts;
    },
    [runeforges, selectedRunes]
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
    if (hasSelectedRunes && !isPlacementAnimating) {
      cancelSelection();
    }
  };

  return (
    <div className="h-full w-full flex flex-col justify-start gap-4 p-[min(1.2vmin,16px)]" onClick={handleDraftingTableClick}>
      <div className="flex-1 flex flex-col gap-[14px] w-full">
        {runeforges.map((runeforge) => (
          <RuneforgeView
            key={runeforge.id}
            runeforge={runeforge}
            hoveredRuneType={hoveredRuneTypeByRuneforge[runeforge.id] ?? null}
            animatingRuneIdSet={animatingRuneIdSet}
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
