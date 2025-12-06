/**
 * ArtefactsRow - displays a horizontal row of selected artefact icons
 */

import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from '../utils/artefactEffects';

interface ArtefactsRowProps {
  selectedArtefactIds: ArtefactId[];
  compact?: boolean;
}

export function ArtefactsRow({ selectedArtefactIds, compact = false }: ArtefactsRowProps) {
  if (selectedArtefactIds.length === 0) {
    return null;
  }

  // Match rune cell sizes: medium = 35px, large = 60px
  const iconSize = compact ? 'w-[60px] h-[60px]' : 'w-[100px] h-[100px]';
  const gap = compact ? 'gap-1.5' : 'gap-2';

  return (
    <div className={`flex items-center ${gap} flex-wrap`}>
      {selectedArtefactIds.map((artefactId) => {
        const artefact = ARTEFACTS[artefactId];
        if (!artefact) return null;

        const effectDescription = getArtefactEffectDescription(artefactId);
        const tooltipText = `${artefact.name}\n${effectDescription}`;
        
        return (
          <div
            key={artefactId}
            className={`${iconSize} rounded-lg overflow-hidden border border-slate-600/50 bg-slate-900/50 shadow-lg`}
            title={tooltipText}
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
