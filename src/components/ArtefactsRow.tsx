/**
 * ArtefactsRow - displays a horizontal row of selected artefact icons
 */

import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from '../utils/artefactEffects';
import { useState } from 'react';

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

  const [hovered, setHovered] = useState<{
    id: ArtefactId | null;
    rect: { left: number; top: number; width: number; height: number } | null;
  }>({ id: null, rect: null });

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
            onMouseEnter={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setHovered({
                id: artefactId,
                rect: {
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                },
              });
            }}
            onMouseLeave={() => setHovered({ id: null, rect: null })}
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

      {hovered.id && hovered.rect && (
        (() => {
          const art = ARTEFACTS[hovered.id as ArtefactId];
          if (!art) return null;
          const desc = getArtefactEffectDescription(hovered.id as ArtefactId);
          return (
            <div
              className="pointer-events-none fixed z-50 max-w-[320px] rounded-md border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-slate-100 shadow-lg"
              style={{
                left: hovered.rect.left + hovered.rect.width / 2,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="text-sm font-semibold text-slate-50">{art.name}</div>
              <div className="mt-1 text-[12px] text-slate-300 whitespace-pre-wrap">{desc}</div>
            </div>
          );
        })()
      )}
    </div>
  );
}
