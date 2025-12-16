/**
 * ArtefactsView - modal for selecting and purchasing artefacts
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import type { FocusEvent, MouseEvent, PointerEvent } from 'react';
import { Modal } from './layout/Modal';
import { TooltipBubble, type TooltipAnchorRect } from './TooltipBubble';
import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS, getAllArtefacts, MAX_SELECTED_ARTEFACTS } from '../types/artefacts';
import { useArtefactStore } from '../state/stores/artefactStore';
import { getArtefactEffectDescription } from '../utils/artefactEffects';
import arcaneDustIcon from '../assets/stats/arcane_dust.png';
import { useClickSound } from '../hooks/useClickSound';

export interface ArtefactsViewHandle {
  handleKeyDown: (event: KeyboardEvent) => boolean;
}

interface ArtefactsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const toAnchorRect = (element: HTMLElement): TooltipAnchorRect => {
  const rect = element.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
};

export const ArtefactsView = forwardRef<ArtefactsViewHandle, ArtefactsViewProps>(function ArtefactsView({ isOpen, onClose }, ref) {
  const { selectedArtefactIds, ownedArtefactIds, arcaneDust, selectArtefact, unselectArtefact, buyArtefact } = useArtefactStore();
  const playClick = useClickSound();

  const [activeTooltip, setActiveTooltip] = useState<{ id: ArtefactId; rect: TooltipAnchorRect } | null>(null);
  const [touchHideTimer, setTouchHideTimer] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'close' | 'selected' | 'all'>('close');
  const [activeSelectedIndex, setActiveSelectedIndex] = useState<number>(0);
  const [activeAllIndex, setActiveAllIndex] = useState<number>(0);
  const sections: Array<'close' | 'selected' | 'all'> = ['close', 'selected', 'all'];

  const moveSection = (direction: 'up' | 'down') => {
    setActiveSection((current) => {
      const currentIndex = sections.indexOf(current);
      const offset = direction === 'down' ? 1 : -1;
      const nextIndex = (currentIndex + offset + sections.length) % sections.length;
      const next = sections[nextIndex];
      if (next !== current) {
        playClick();
      }
      if (next === 'selected') {
        setActiveSelectedIndex(0);
      }
      if (next === 'all') {
        setActiveAllIndex(0);
      }
      return next;
    });
  };

  const moveSelected = (direction: 'left' | 'right') => {
    if (selectedArtefactIds.length === 0) {
      return;
    }
    setActiveSelectedIndex((current) => {
      const offset = direction === 'right' ? 1 : -1;
      const nextIndex = (current + offset + selectedArtefactIds.length) % selectedArtefactIds.length;
      if (nextIndex !== current) {
        playClick();
      }
      return nextIndex;
    });
  };

  const allArtefacts = useMemo(() => getAllArtefacts(), []);

  const moveAll = (direction: 'left' | 'right') => {
    if (allArtefacts.length === 0) {
      return;
    }
    setActiveAllIndex((current) => {
      const offset = direction === 'right' ? 1 : -1;
      const nextIndex = (current + offset + allArtefacts.length) % allArtefacts.length;
      if (nextIndex !== current) {
        playClick();
      }
      return nextIndex;
    });
  };

  const handleClose = useCallback(() => {
    playClick();
    onClose();
    setActiveSection('close');
  }, [onClose, playClick]);

  const handleArtefactClick = useCallback((artefactId: ArtefactId) => {
    playClick();
    if (selectedArtefactIds.includes(artefactId)) {
      unselectArtefact(artefactId);
      return;
    }

    if (ownedArtefactIds.includes(artefactId)) {
      selectArtefact(artefactId);
    }
  }, [ownedArtefactIds, playClick, selectArtefact, selectedArtefactIds, unselectArtefact]);

  const handleBuyClick = useCallback((artefactId: ArtefactId, event: MouseEvent) => {
    event.stopPropagation();
    playClick();
    buyArtefact(artefactId);
  }, [buyArtefact, playClick]);

  useImperativeHandle(ref, () => ({
    handleKeyDown: (event: KeyboardEvent) => {
      console.log('ArtefactsView Key:', event.key, isOpen);
      if (!isOpen) {
        return false;
      }

      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          moveSection('up');
          return true;
        }
        case 'ArrowDown': {
          event.preventDefault();
          moveSection('down');
          return true;
        }
        case 'ArrowLeft': {
          if (activeSection === 'selected') {
            event.preventDefault();
            moveSelected('left');
            return true;
          }
          if (activeSection === 'all') {
            event.preventDefault();
            moveAll('left');
            return true;
          }
          return false;
        }
        case 'ArrowRight': {
          if (activeSection === 'selected') {
            event.preventDefault();
            moveSelected('right');
            return true;
          }
          if (activeSection === 'all') {
            event.preventDefault();
            moveAll('right');
            return true;
          }
          return false;
        }
        case 'Enter':
        case ' ': // Space
        case 'Spacebar': {
          event.preventDefault();
          if (activeSection === 'close') {
            handleClose();
            return true;
          }
          if (activeSection === 'selected') {
            const targetId = selectedArtefactIds[activeSelectedIndex];
            if (targetId) {
              playClick();
              unselectArtefact(targetId);
            }
            return true;
          }
          if (activeSection === 'all') {
            const target = allArtefacts[activeAllIndex];
            if (!target) {
              return true;
            }
            const isOwned = ownedArtefactIds.includes(target.id);
            if (isOwned) {
              handleArtefactClick(target.id);
              return true;
            }
            const canAfford = arcaneDust >= target.cost;
            playClick();
            if (canAfford) {
              buyArtefact(target.id);
            }
            return true;
          }
          return true;
        }
        case 'Escape': {
          event.preventDefault();
          handleClose();
          return true;
        }
        default:
          return false;
      }
    },
  }));

  useEffect(() => {
    if (!isOpen) {
      setActiveSection('close');
      setActiveSelectedIndex(0);
      setActiveAllIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      if (touchHideTimer !== null) {
        window.clearTimeout(touchHideTimer);
        setTouchHideTimer(null);
      }
      setActiveTooltip(null);
    }
  }, [isOpen, touchHideTimer]);

  useEffect(() => {
    if (activeSelectedIndex >= selectedArtefactIds.length) {
      setActiveSelectedIndex(Math.max(0, selectedArtefactIds.length - 1));
    }
  }, [activeSelectedIndex, selectedArtefactIds]);

  useEffect(() => {
    if (activeAllIndex >= allArtefacts.length) {
      setActiveAllIndex(0);
    }
  }, [activeAllIndex, allArtefacts.length]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Artefacts"
      maxWidth={800}
      closeButtonClassName="data-[active=true]:text-sky-100 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
      closeButtonDataActive={activeSection === 'close' ? 'true' : undefined}
    >
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
                {selectedArtefactIds.map((artefactId, index) => {
                  const artefact = ARTEFACTS[artefactId];
                  if (!artefact) return null;
                  const effectDescription = getArtefactEffectDescription(artefactId);
                  const tooltipText = `${artefact.name}\n${effectDescription}`;
                  const isActive = activeSection === 'selected' && activeSelectedIndex === index;

                  return (
                    <button
                      key={artefactId}
                      onClick={() => {
                        playClick();
                        unselectArtefact(artefactId);
                      }}
                      data-active={isActive ? 'true' : undefined}
                      className="group relative h-16 w-16 overflow-hidden rounded-lg border border-sky-400/50 bg-slate-800 shadow-lg transition hover:border-sky-400 hover:shadow-xl data-[active=true]:border-sky-300 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)]"
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
            {allArtefacts.map((artefact, index) => {
              const isOwned = ownedArtefactIds.includes(artefact.id);
              const isSelected = selectedArtefactIds.includes(artefact.id);
              const canAfford = arcaneDust >= artefact.cost;
              const effectDescription = getArtefactEffectDescription(artefact.id);
              const tooltipText = `${artefact.name}\n${effectDescription}`;
              const isActive = activeSection === 'all' && activeAllIndex === index;

              return (
                <div
                  key={artefact.id}
                  data-active={isActive ? 'true' : undefined}
                  className={`h-32 w-32 relative cursor-pointer overflow-hidden rounded-xl border transition data-[active=true]:border-sky-300 data-[active=true]:shadow-[0_0_0_2px_rgba(56,189,248,0.35)] data-[active=true]:scale-[1.02] ${
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
                      <span>Buy</span>
                      <img src={arcaneDustIcon} alt="Dust" className="h-4 w-4" />
                      <span>{artefact.cost}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
});
