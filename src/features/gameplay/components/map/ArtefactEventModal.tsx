import { useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react';
import { ArtefactsRow } from '../../../../components/ArtefactsRow';
import { useGameplayActions } from '../../../../hooks/useGameActions';
import { useSoloMapState } from '../../../../hooks/useGameState';
import { ARTEFACTS } from '../../../../types/artefacts';
import { getCurrentMapLocationEvent } from '../../../../utils/soloMap';
import { useClickSound } from '../../../../hooks/useClickSound';

export function ArtefactEventModal(): ReactElement | null {
  const map = useSoloMapState();
  const { claimArtefactEvent, skipArtefactEvent } = useGameplayActions();
  const playClickSound = useClickSound();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const claimButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const event = getCurrentMapLocationEvent(map);
  const isOpen = event?.kind === 'artefact' && !event.cleared;
  const artefact = event?.offeredArtefactId ? ARTEFACTS[event.offeredArtefactId] : null;

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    claimButtonRef.current?.focus({ preventScroll: true });
    return () => {
      const fallback = document.querySelector<HTMLElement>('[data-map-current="true"]');
      (previousFocusRef.current?.isConnected ? previousFocusRef.current : fallback)?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen || !artefact || event.arcaneDustReward === undefined) return null;

  const claim = () => { playClickSound(); claimArtefactEvent(); };
  const skip = () => { playClickSound(); skipArtefactEvent(); };
  const handleKeyDown = (keyboardEvent: KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.key === 'Escape') { keyboardEvent.preventDefault(); skip(); return; }
    if (keyboardEvent.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (keyboardEvent.shiftKey && document.activeElement === first) { keyboardEvent.preventDefault(); last.focus(); }
    if (!keyboardEvent.shiftKey && document.activeElement === last) { keyboardEvent.preventDefault(); first.focus(); }
  };

  return (
    <div className="pixel-modal-backdrop absolute inset-0 z-90 flex items-center justify-center px-4 py-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="artefact-event-title" className="pixel-modal w-[min(460px,94%)] p-2 font-pixel" onKeyDown={handleKeyDown}>
        <div className="pixel-modal__inner p-6 text-center">
          <h2 id="artefact-event-title" className="pixel-section-title text-2xl">Artefact</h2>
          <p className="mt-4 text-xs text-[#b5d3bd]">Claim this artefact and {event.arcaneDustReward} Arcane Dust?</p>
          <div className="mx-auto mt-5 w-fit pixel-game-panel-inset px-4 py-3">
            <ArtefactsRow selectedArtefactIds={[artefact.id]} />
          </div>
          <p className="mt-3 text-xs text-[#fff8d8]">{artefact.name}</p>
          <footer className="mt-6 flex justify-center gap-3 border-t-4 border-[#141313] pt-4">
            <button type="button" onClick={skip} className="pixel-game-button !bg-[#efe7c3] px-5 py-3 text-xs tracking-[0.16em] !text-[#171518]">Skip</button>
            <button ref={claimButtonRef} type="button" onClick={claim} className="pixel-game-button px-5 py-3 text-xs tracking-[0.16em]">Claim</button>
          </footer>
        </div>
      </div>
    </div>
  );
}
