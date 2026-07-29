/** Artefact selection and purchase overlay. */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { TooltipBubble, type TooltipAnchorRect } from './TooltipBubble';
import { useArtefactActions } from '../hooks/useGameActions';
import { useArtefactInventoryState } from '../hooks/useGameState';
import type { ArtefactId } from '../types/artefacts';
import { ARTEFACTS, getAllArtefacts, MAX_SELECTED_ARTEFACTS } from '../types/artefacts';
import { getArtefactEffectDescription } from '../utils/artefactDescriptions';
import arcaneDustIcon from '../assets/stats/arcane_dust.png';
import { useClickSound } from '../hooks/useClickSound';

type ArtefactSection = 'close' | 'selected' | 'all';

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
  const { selectedArtefactIds, ownedArtefactIds, arcaneDust } = useArtefactInventoryState();
  const { selectArtefact, unselectArtefact, buyArtefact } = useArtefactActions();
  const playClick = useClickSound();
  const allArtefacts = useMemo(() => getAllArtefacts(), []);
  const [activeTooltip, setActiveTooltip] = useState<{ id: ArtefactId; rect: TooltipAnchorRect } | null>(null);
  const [touchHideTimer, setTouchHideTimer] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<ArtefactSection | null>(null);
  const [activeSelectedIndex, setActiveSelectedIndex] = useState(0);
  const [activeAllIndex, setActiveAllIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const selectedButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const allButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const openedWithKeyboardRef = useRef(false);
  const isInitialFocusRef = useRef(true);

  const handleClose = useCallback(() => {
    playClick();
    onClose();
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

  const handleBuy = useCallback((artefactId: ArtefactId) => {
    const artefact = ARTEFACTS[artefactId];
    if (!artefact || arcaneDust < artefact.cost) {
      return;
    }
    playClick();
    buyArtefact(artefactId);
  }, [arcaneDust, buyArtefact, playClick]);

  const focusSection = useCallback((section: ArtefactSection) => {
    setActiveSection(section);
    if (section === 'close') {
      closeButtonRef.current?.focus();
      return;
    }
    if (section === 'selected') {
      setActiveSelectedIndex(0);
      const firstArtefact = selectedArtefactIds[0];
      if (firstArtefact) selectedButtonRefs.current[firstArtefact]?.focus();
      return;
    }
    setActiveAllIndex(0);
    const firstArtefact = allArtefacts[0];
    if (firstArtefact) allButtonRefs.current[firstArtefact.id]?.focus();
  }, [allArtefacts, selectedArtefactIds]);

  const moveSection = useCallback((direction: 'up' | 'down') => {
    const sections: ArtefactSection[] = selectedArtefactIds.length > 0
      ? ['close', 'selected', 'all']
      : ['close', 'all'];
    const currentIndex = activeSection === null ? -1 : sections.indexOf(activeSection);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const offset = direction === 'down' ? 1 : -1;
    const next = sections[(safeIndex + offset + sections.length) % sections.length];
    focusSection(next);
    playClick();
  }, [activeSection, focusSection, playClick, selectedArtefactIds.length]);

  const moveSelected = useCallback((direction: 'left' | 'right') => {
    if (selectedArtefactIds.length === 0) return;
    const offset = direction === 'right' ? 1 : -1;
    const nextIndex = (activeSelectedIndex + offset + selectedArtefactIds.length) % selectedArtefactIds.length;
    setActiveSelectedIndex(nextIndex);
    selectedButtonRefs.current[selectedArtefactIds[nextIndex]]?.focus();
    playClick();
  }, [activeSelectedIndex, playClick, selectedArtefactIds]);

  const moveAll = useCallback((direction: 'left' | 'right') => {
    if (allArtefacts.length === 0) return;
    const offset = direction === 'right' ? 1 : -1;
    const nextIndex = (activeAllIndex + offset + allArtefacts.length) % allArtefacts.length;
    setActiveAllIndex(nextIndex);
    allButtonRefs.current[allArtefacts[nextIndex].id]?.focus();
    playClick();
  }, [activeAllIndex, allArtefacts, playClick]);

  const handleKeyboardEvent = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return false;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        moveSection('up');
        return true;
      case 'ArrowDown':
        event.preventDefault();
        moveSection('down');
        return true;
      case 'ArrowLeft':
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
      case 'ArrowRight':
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
      case 'Enter':
      case ' ':
      case 'Spacebar': {
        event.preventDefault();
        if (activeSection === null) {
          focusSection('close');
          playClick();
        } else if (activeSection === 'close') {
          handleClose();
        } else if (activeSection === 'selected') {
          const artefactId = selectedArtefactIds[activeSelectedIndex];
          if (artefactId) handleArtefactClick(artefactId);
        } else {
          const artefact = allArtefacts[activeAllIndex];
          if (!artefact) return true;
          if (ownedArtefactIds.includes(artefact.id)) {
            handleArtefactClick(artefact.id);
          } else {
            handleBuy(artefact.id);
          }
        }
        return true;
      }
      case 'Escape':
        event.preventDefault();
        handleClose();
        return true;
      default:
        return false;
    }
  }, [activeAllIndex, activeSection, activeSelectedIndex, allArtefacts, focusSection, handleArtefactClick, handleBuy, handleClose, isOpen, moveAll, moveSection, moveSelected, ownedArtefactIds, playClick, selectedArtefactIds]);

  useImperativeHandle(ref, () => ({ handleKeyDown: handleKeyboardEvent }), [handleKeyboardEvent]);

  useEffect(() => {
    if (!isOpen) {
      setActiveSection(null);
      setActiveSelectedIndex(0);
      setActiveAllIndex(0);
      return;
    }

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openedWithKeyboardRef.current = previouslyFocusedElementRef.current?.matches(':focus-visible') ?? false;
    isInitialFocusRef.current = true;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
      if (openedWithKeyboardRef.current) setActiveSection('close');
      isInitialFocusRef.current = false;
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      const previouslyFocusedElement = previouslyFocusedElementRef.current;
      if (previouslyFocusedElement?.isConnected) {
        window.requestAnimationFrame(() => previouslyFocusedElement.focus());
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (activeSelectedIndex >= selectedArtefactIds.length) {
      setActiveSelectedIndex(Math.max(0, selectedArtefactIds.length - 1));
    }
  }, [activeSelectedIndex, selectedArtefactIds.length]);

  useEffect(() => {
    if (activeAllIndex >= allArtefacts.length) setActiveAllIndex(0);
  }, [activeAllIndex, allArtefacts.length]);

  useEffect(() => {
    if (!isOpen) {
      if (touchHideTimer !== null) window.clearTimeout(touchHideTimer);
      setTouchHideTimer(null);
      setActiveTooltip(null);
    }
  }, [isOpen, touchHideTimer]);

  useEffect(() => () => {
    if (touchHideTimer !== null) window.clearTimeout(touchHideTimer);
  }, [touchHideTimer]);

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
    if (event.pointerType !== 'touch') showTooltip(artefactId, event.currentTarget);
  };

  const handlePointerDownTooltip = (artefactId: ArtefactId, event: PointerEvent<HTMLElement>) => {
    setActiveSection(null);
    if (event.pointerType === 'touch') {
      showTooltip(artefactId, event.currentTarget);
      setTouchHideTimer(window.setTimeout(() => setActiveTooltip(null), 2000));
    }
  };

  const handleFocusTooltip = (artefactId: ArtefactId, event: FocusEvent<HTMLElement>, section: ArtefactSection, index: number) => {
    if (event.currentTarget.matches(':focus-visible')) {
      setActiveSection(section);
      if (section === 'selected') setActiveSelectedIndex(index);
      if (section === 'all') setActiveAllIndex(index);
    }
    showTooltip(artefactId, event.currentTarget);
  };

  const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])');
    if (!controls || controls.length === 0) return;
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pixel-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-6" onClick={handleClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="artefacts-title"
        className="pixel-modal relative max-h-[94vh] w-[min(960px,94vw)] overflow-y-auto p-2"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={() => setActiveSection(null)}
        onKeyDown={(event) => {
          event.stopPropagation();
          trapFocus(event);
          if (event.key !== 'Tab') handleKeyboardEvent(event.nativeEvent);
        }}
      >
        <div className="pixel-modal__inner space-y-6 px-6 py-8 md:px-8 md:py-10">
          <button
            ref={closeButtonRef}
            type="button"
            className="pixel-icon-button absolute right-8 top-8"
            data-active={activeSection === 'close' ? 'true' : undefined}
            onClick={handleClose}
            onFocus={(event) => {
              if (!isInitialFocusRef.current && event.currentTarget.matches(':focus-visible')) setActiveSection('close');
            }}
            onPointerDown={() => setActiveSection(null)}
            aria-label="Close artefacts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>

          <div className="border-b-4 border-[#141313] pb-5 pr-14">
            <h2 id="artefacts-title" className="font-pixel text-3xl uppercase tracking-[0.15em] text-[#fff8d8] [text-shadow:3px_3px_0_#141313]">Artefacts</h2>
          </div>

          <div className="pixel-control flex items-center gap-3 px-4 py-3">
            <img src={arcaneDustIcon} alt="Arcane Dust" className="h-8 w-8" />
            <span className="font-pixel text-lg text-[#f2c14e]">{arcaneDust.toLocaleString()}</span>
          </div>

          <section>
            <h3 className="font-pixel mb-3 text-xs uppercase tracking-[0.18em] text-[#fff8d8]">Selected Artefacts ({selectedArtefactIds.length}/{MAX_SELECTED_ARTEFACTS})</h3>
            <div className="pixel-control min-h-24 p-4">
              {selectedArtefactIds.length === 0 ? (
                <p className="font-pixel text-center text-[10px] uppercase text-[#b5d3bd]">No artefacts selected</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {selectedArtefactIds.map((artefactId, index) => {
                    const artefact = ARTEFACTS[artefactId];
                    if (!artefact) return null;
                    const tooltipText = `${artefact.name}\n${getArtefactEffectDescription(artefactId)}`;
                    return (
                      <button
                        key={artefactId}
                        ref={(element) => { selectedButtonRefs.current[artefactId] = element; }}
                        type="button"
                        className="relative h-16 w-16 overflow-hidden border-4 border-[#141313] bg-[#293532] data-[active=true]:outline-4 data-[active=true]:outline-[#ffdc52] data-[active=true]:outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#fff8d8] focus-visible:outline-offset-4"
                        data-active={activeSection === 'selected' && activeSelectedIndex === index ? 'true' : undefined}
                        onClick={() => handleArtefactClick(artefactId)}
                        onPointerEnter={(event) => handlePointerEnterTooltip(artefactId, event)}
                        onPointerLeave={hideTooltip}
                        onPointerDown={(event) => handlePointerDownTooltip(artefactId, event)}
                        onFocus={(event) => handleFocusTooltip(artefactId, event, 'selected', index)}
                        onBlur={hideTooltip}
                        aria-label={`${tooltipText}. Remove from selected artefacts.`}
                      >
                        <img src={artefact.image} alt="" className="h-full w-full object-cover" />
                        <TooltipBubble text={tooltipText} anchorRect={activeTooltip?.id === artefactId ? activeTooltip.rect : null} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="font-pixel mb-3 text-xs uppercase tracking-[0.18em] text-[#fff8d8]">All Artefacts</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {allArtefacts.map((artefact, index) => {
                const isOwned = ownedArtefactIds.includes(artefact.id);
                const isSelected = selectedArtefactIds.includes(artefact.id);
                const canAfford = arcaneDust >= artefact.cost;
                const tooltipText = `${artefact.name}\n${getArtefactEffectDescription(artefact.id)}`;
                return (
                  <div key={artefact.id} className="pixel-control relative min-w-0 p-2">
                    <button
                      ref={(element) => { allButtonRefs.current[artefact.id] = element; }}
                      type="button"
                      className={`block w-full border-4 border-[#141313] bg-[#293532] data-[active=true]:outline-4 data-[active=true]:outline-[#ffdc52] data-[active=true]:outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#fff8d8] focus-visible:outline-offset-4 ${!isOwned ? 'opacity-50' : ''}`}
                      data-active={activeSection === 'all' && activeAllIndex === index ? 'true' : undefined}
                      onClick={() => {
                        if (isOwned) handleArtefactClick(artefact.id);
                      }}
                      onPointerEnter={(event) => handlePointerEnterTooltip(artefact.id, event)}
                      onPointerLeave={hideTooltip}
                      onPointerDown={(event) => handlePointerDownTooltip(artefact.id, event)}
                      onFocus={(event) => handleFocusTooltip(artefact.id, event, 'all', index)}
                      onBlur={hideTooltip}
                      aria-label={`${tooltipText}. ${isOwned ? (isSelected ? 'Selected.' : 'Owned.') : `Costs ${artefact.cost} Arcane Dust.`}`}
                    >
                      <img src={artefact.image} alt="" className="aspect-square w-full object-cover" />
                      <span className="font-pixel block border-t-4 border-[#141313] px-1 py-2 text-center text-[9px] uppercase text-[#fff8d8]">{artefact.name}</span>
                      <TooltipBubble text={tooltipText} anchorRect={activeTooltip?.id === artefact.id ? activeTooltip.rect : null} />
                    </button>
                    {!isOwned && (
                      <button
                        type="button"
                        className="pixel-button pixel-button--compact mt-2 min-h-0 px-2 py-2 text-[9px] tracking-[0.1em] disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={(event: MouseEvent<HTMLButtonElement>) => {
                          event.stopPropagation();
                          handleBuy(artefact.id);
                        }}
                        disabled={!canAfford}
                      >
                        Buy {artefact.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <p className="font-pixel text-center text-[10px] uppercase tracking-[0.08em] text-[#b5d3bd]">↑ ↓ sections · ← → artefacts</p>
        </div>
      </div>
    </div>
  );
});
