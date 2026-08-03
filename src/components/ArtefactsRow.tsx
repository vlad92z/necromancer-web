/**
 * ArtefactsRow - displays a horizontal row of selected artefact icons
 */

import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from '../utils/artefactDescriptions';

interface ArtefactsRowProps {
  selectedArtefactIds: ArtefactId[];
  compact?: boolean;
  onArtefactHover?: (artefactId: ArtefactId) => void;
  onArtefactLeave?: () => void;
}

export function ArtefactsRow({
  selectedArtefactIds,
  compact = false,
  onArtefactHover,
  onArtefactLeave,
}: ArtefactsRowProps) {
  const isEmpty = selectedArtefactIds.length === 0;

  // Match rune cell sizes: medium = 35px, large = 60px
  const iconSize = compact ? 'w-[60px] h-[60px]' : 'w-[100px] h-[100px]';
  const gap = compact ? 'gap-1.5' : 'gap-2';

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
            className={`${iconSize} overflow-hidden border-[3px] border-[#141313] bg-[#293532] shadow-[4px_4px_0_#141313]`}
            role="img"
            aria-label={tooltipText}
            onMouseEnter={() => onArtefactHover?.(artefactId)}
            onMouseLeave={onArtefactLeave}
          >
            <img
              src={artefact.image}
              alt={artefact.name}
              className="h-full w-full object-cover [image-rendering:pixelated]"
            />
          </div>
        );
      })}
    </div>
  );
}
