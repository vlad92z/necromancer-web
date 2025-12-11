/**
 * ArtefactsRow - displays a horizontal row of selected artefact icons
 */

import type { PointerEvent } from 'react';
import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from '../utils/artefactEffects';
import { buildArtefactTooltipCards } from '../utils/tooltipCards';
import { useGameplayStore } from '../state/stores/gameplayStore';

interface ArtefactsRowProps {
  selectedArtefactIds: ArtefactId[];
  compact?: boolean;
}

export function ArtefactsRow({ selectedArtefactIds, compact = false }: ArtefactsRowProps) {
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const isEmpty = selectedArtefactIds.length === 0;

  // Match rune cell sizes: medium = 35px, large = 60px
  const iconSize = compact ? 'w-[60px] h-[60px]' : 'w-[100px] h-[100px]';
  const gap = compact ? 'gap-1.5' : 'gap-2';

  const handlePointerEnter = (artefactId: ArtefactId, event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') {
      setTooltipCards(buildArtefactTooltipCards(selectedArtefactIds, artefactId));
    }
  };

  const handlePointerDown = (artefactId: ArtefactId, event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      setTooltipCards(buildArtefactTooltipCards(selectedArtefactIds, artefactId));
    }
  };

  if (isEmpty) {
    return null;
  }

  return (
    <div className={`relative flex items-center ${gap} flex-wrap`}>
      {selectedArtefactIds.map((artefactId) => {
        const artefact = ARTEFACTS[artefactId];
        if (!artefact) return null;

        const effectDescription = getArtefactEffectDescription(artefactId);
        const tooltipText = `${artefact.name}\n${effectDescription}`;
        
        return (
          <div
            key={artefactId}
            className={`${iconSize} rounded-lg overflow-hidden border border-slate-600/50 bg-slate-900/50 shadow-lg`}
            onPointerEnter={(event) => handlePointerEnter(artefactId, event)}
            onPointerLeave={resetTooltipCards}
            onPointerDown={(event) => handlePointerDown(artefactId, event)}
            role="img"
            aria-label={tooltipText}
          >
            <img
              src={artefact.image}
              alt={artefact.name}
              className="w-full h-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}
