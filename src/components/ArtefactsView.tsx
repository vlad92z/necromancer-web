/**
 * ArtefactsView - modal for selecting and purchasing artefacts
 */

import { useEffect, useState } from 'react';
import type { FocusEvent, MouseEvent, PointerEvent } from 'react';
import { Modal } from './layout/Modal';
import { TooltipBubble, type TooltipAnchorRect } from './TooltipBubble';
import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS, getAllArtefacts, MAX_SELECTED_ARTEFACTS } from '../types/artefacts';
import { useArtefactStore } from '../state/stores/artefactStore';
import { getArtefactEffectDescription } from '../utils/artefactEffects';
import arcaneDustIcon from '../assets/stats/arcane_dust.png';

interface ArtefactsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const toAnchorRect = (element: HTMLElement): TooltipAnchorRect => {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
};

export function ArtefactsView({ isOpen, onClose }: ArtefactsViewProps) {
  const { selectedArtefactIds, ownedArtefactIds, arcaneDust, selectArtefact, unselectArtefact, buyArtefact } = useArtefactStore();

  const [activeTooltip, setActiveTooltip] = useState<{ id: ArtefactId; rect: TooltipAnchorRect } | null>(null);
  const [touchHideTimer, setTouchHideTimer] = useState<number | null>(null);

  const clearTouchHideTimer = () => {
    if (touchHideTimer !== null) {
      window.clearTimeout(touchHideTimer);
      setTouchHideTimer(null);
    }
  };

  const showTooltip = (artefactId: ArtefactId, element: HTMLElement) => {
    clearTouchHideTimer();
    setActiveTooltip({ id: artefactId, rect: toAnchorRect(element) });
  };

  const hideTooltip = () => {
    clearTouchHideTimer();
    setActiveTooltip(null);
  };

  const handlePointerEnterTooltip = (artefactId: ArtefactId, event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch') {
      showTooltip(artefactId, event.currentTarget);
    }
  };

  const handlePointerDownTooltip = (artefactId: ArtefactId, event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') {
      showTooltip(artefactId, event.currentTarget);
      const timer = window.setTimeout(() => setActiveTooltip(null), 2000);
      setTouchHideTimer(timer);
    }
  };

  const handleFocusTooltip = (artefactId: ArtefactId, event: FocusEvent<HTMLElement>) => {
    showTooltip(artefactId, event.currentTarget);
  };

  useEffect(() => () => {
    if (touchHideTimer !== null) {
      window.clearTimeout(touchHideTimer);
    }
  }, [touchHideTimer]);

  useEffect(() => {
    if (!isOpen) {
      clearTouchHideTimer();
      setActiveTooltip(null);
    }
  }, [isOpen, touchHideTimer]);

  const allArtefacts = getAllArtefacts();

  const handleArtefactClick = (artefactId: ArtefactId) => {
    if (selectedArtefactIds.includes(artefactId)) {
      unselectArtefact(artefactId);
    } else if (ownedArtefactIds.includes(artefactId)) {
      selectArtefact(artefactId);
    }
  };

  const handleBuyClick = (artefactId: ArtefactId, event: MouseEvent) => {
    event.stopPropagation();
    buyArtefact(artefactId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Artefacts" maxWidth={800}>
      <div className="space-y-6">
        {/* Arcane Dust Display */}
        <div className="flex items-center rounded-xl border border-amber-300/30 bg-amber-100/5 px-4 py-3">
          <img src={arcaneDustIcon} alt="Arcane Dust" className="h-8 w-8" />
          <span className="text-2xl font-extrabold text-amber-200">{arcaneDust.toLocaleString()}</span>
        </div>

        {/* Selected Artefacts Row */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
            Selected Artefacts ({selectedArtefactIds.length}/{MAX_SELECTED_ARTEFACTS})
          </h3>
          <div className="min-h-[80px] rounded-xl border border-slate-600/40 bg-slate-900/50 p-4">
            {selectedArtefactIds.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {selectedArtefactIds.map((artefactId) => {
                  const artefact = ARTEFACTS[artefactId];
                  if (!artefact) return null;
                  const effectDescription = getArtefactEffectDescription(artefactId);
                  const tooltipText = `${artefact.name}\n${effectDescription}`;

                  return (
                    <button
                      key={artefactId}
                      onClick={() => unselectArtefact(artefactId)}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-sky-400/50 bg-slate-800 shadow-lg transition hover:border-sky-400 hover:shadow-xl"
                      onPointerEnter={(event) => handlePointerEnterTooltip(artefactId, event)}
                      onPointerLeave={hideTooltip}
                      onPointerDown={(event) => handlePointerDownTooltip(artefactId, event)}
                      onFocus={(event) => handleFocusTooltip(artefactId, event)}
                      onBlur={hideTooltip}
                      aria-label={tooltipText}
                    >
                      <img
                        src={artefact.image}
                        alt={artefact.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-red-500/0 transition group-hover:bg-red-500/20" />
                      <TooltipBubble
                        text={tooltipText}
                        anchorRect={activeTooltip?.id === artefactId ? activeTooltip.rect : null}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* All Artefacts Grid */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">All Artefacts</h3>
          <div className="grid grid-cols-5">
            {allArtefacts.map((artefact) => {
              const isOwned = ownedArtefactIds.includes(artefact.id);
              const isSelected = selectedArtefactIds.includes(artefact.id);
              const canAfford = arcaneDust >= artefact.cost;
              const effectDescription = getArtefactEffectDescription(artefact.id);
              const tooltipText = `${artefact.name}\n${effectDescription}`;

              return (
                <div
                  key={artefact.id}

                  className={`h-32 w-32 relative cursor-pointer overflow-hidden rounded-xl border transition ${
                    isOwned
                      ? isSelected
                        ? 'border-sky-400 bg-slate-800 shadow-lg'
                        : 'border-slate-600/50 bg-slate-900/50 hover:border-slate-500'
                      : 'border-slate-700/40 bg-slate-900/30'
                  }`}
                  onClick={() => handleArtefactClick(artefact.id)}
                  onPointerEnter={(event) => handlePointerEnterTooltip(artefact.id, event)}
                  onPointerLeave={hideTooltip}
                  onPointerDown={(event) => handlePointerDownTooltip(artefact.id, event)}
                  onFocus={(event) => handleFocusTooltip(artefact.id, event)}
                  onBlur={hideTooltip}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleArtefactClick(artefact.id);
                    }
                  }}
                  aria-label={tooltipText}
                  role="button"
                  tabIndex={0}
                >
                  {/* Artefact Image */}
                  <div className={`aspect-square ${isOwned ? 'opacity-100' : 'opacity-40'}`}>
                    <img
                      src={artefact.image}
                      alt={artefact.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Artefact Name */}
                  <div className="border-t border-slate-700/50 bg-slate-900/70 px-2 py-2 text-center">
                    <div className="text-xs font-semibold text-slate-300">{artefact.name}</div>
                  </div>

                  {/* Buy Button for unowned artefacts */}
                  {!isOwned && (
                    <button
                      onClick={(e) => handleBuyClick(artefact.id, e)}
                      disabled={!canAfford}
                      className={`absolute bottom-2 right-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide transition ${
                        canAfford
                          ? 'border border-amber-400/50 bg-amber-500/90 text-slate-900 hover:bg-amber-400'
                          : 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500'
                      }`}
                    >
                      <img src={arcaneDustIcon} alt="" aria-hidden className="h-3 w-3" />
                      <span>{artefact.cost}</span>
                    </button>
                  )}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute left-2 top-2 rounded-full border border-sky-400 bg-sky-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                      ✓
                    </div>
                  )}
                  <TooltipBubble
                    text={tooltipText}
                    anchorRect={activeTooltip?.id === artefact.id ? activeTooltip.rect : null}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
