/**
 * ArtefactsRow - displays a horizontal row of selected artefact icons
 */

import { useEffect, useState } from 'react';
import type { PointerEvent } from 'react';
import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from '../utils/artefactEffects';
import { TooltipBubble, type TooltipAnchorRect } from './TooltipBubble';

interface ArtefactsRowProps {
  selectedArtefactIds: ArtefactId[];
  compact?: boolean;
}

const toAnchorRect = (element: HTMLElement): TooltipAnchorRect => {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
};

export function ArtefactsRow({ selectedArtefactIds, compact = false }: ArtefactsRowProps) {
  const [tooltip, setTooltip] = useState<{ id: ArtefactId; rect: TooltipAnchorRect } | null>(null);
  const [touchHideTimer, setTouchHideTimer] = useState<number | null>(null);
  const isEmpty = selectedArtefactIds.length === 0;

  // Match rune cell sizes: medium = 35px, large = 60px
  const iconSize = compact ? 'w-[60px] h-[60px]' : 'w-[100px] h-[100px]';
  const gap = compact ? 'gap-1.5' : 'gap-2';

  const clearTouchHideTimer = () => {
    if (touchHideTimer !== null) {
      window.clearTimeout(touchHideTimer);
      setTouchHideTimer(null);
    }
  };

  const showTooltip = (artefactId: ArtefactId, element: HTMLElement) => {
    clearTouchHideTimer();
    setTooltip({ id: artefactId, rect: toAnchorRect(element) });
  };

  const hideTooltip = () => {
    clearTouchHideTimer();
    setTooltip(null);
  };

  const handlePointerEnter = (artefactId: ArtefactId, event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') {
      showTooltip(artefactId, event.currentTarget);
    }
  };

  const handlePointerDown = (artefactId: ArtefactId, event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      showTooltip(artefactId, event.currentTarget);
      const timer = window.setTimeout(() => setTooltip(null), 2000);
      setTouchHideTimer(timer);
    }
  };

  useEffect(() => () => {
    if (touchHideTimer !== null) {
      window.clearTimeout(touchHideTimer);
    }
  }, [touchHideTimer]);

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
            onPointerLeave={hideTooltip}
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

      {tooltip && (() => {
        const artefact = ARTEFACTS[tooltip.id];
        if (!artefact) return null;
        return (
          <TooltipBubble
            text={`${artefact.name}\n${getArtefactEffectDescription(tooltip.id)}`}
            anchorRect={tooltip.rect}
          />
        );
      })()}
    </div>
  );
}
