import { useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { useClickSound } from '../../../hooks/useClickSound';
import type { Rune } from '../../../types/game';
import type { ArenaMonsterDetails } from '../../../utils/arenaCatalog';
import { buildRuneTooltipCards } from '../../../utils/tooltipCards';
import { CardView } from '../../gameplay/components/Player/CardView';

interface ArenaEnemyOverlayProps {
  details: ArenaMonsterDetails;
  onClose: () => void;
}

interface ArenaRuneRowProps {
  runes: Rune[];
}

function ArenaRuneRow({ runes }: ArenaRuneRowProps) {
  const cards = buildRuneTooltipCards(runes);

  return (
    <div className="flex min-w-max gap-3 pb-2">
      {cards.map((card) => (
        <CardView
          key={card.id}
          title={card.title}
          imageSrc={card.imageSrc}
          manaCost={card.manaCost}
          description={card.description}
          runeTypes={card.runeTypes}
          variant={card.variant}
          size="compact"
        />
      ))}
    </div>
  );
}

export function ArenaEnemyOverlay({ details, onClose }: ArenaEnemyOverlayProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const playClickSound = useClickSound();

  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      const previousElement = previouslyFocusedElementRef.current;
      if (previousElement?.isConnected) {
        window.requestAnimationFrame(() => previousElement.focus());
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    playClickSound();
    onClose();
  }, [onClose, playClickSound]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements || focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const titleId = `arena-${details.monster.id}-title`;

  return (
    <div
      className="pixel-modal-backdrop fixed inset-0 z-1000 flex items-center justify-center px-5 py-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="pixel-modal flex max-h-[90vh] w-[min(1120px,94vw)] flex-col overflow-hidden p-2 font-pixel"
        onKeyDown={handleKeyDown}
      >
        <div className="pixel-modal__inner flex min-h-0 flex-1 flex-col p-5 md:p-7">
          <header className="flex items-start justify-between gap-5 border-b-4 border-[#141313] pb-5">
            <div>
              <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#f2c14e]">
                {details.monster.isBoss ? 'Boss' : 'Enemy'}
              </div>
              <h2 id={titleId} className="pixel-section-title text-2xl md:text-3xl">
                {details.monster.name}
              </h2>
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-[#b5d3bd]">
                Turn cycle repeats after Turn {details.turns.length}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              className="pixel-game-button px-4 py-3 text-xs tracking-[0.12em]"
            >
              Close
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto pr-2 pt-6">
            <section aria-labelledby={`${titleId}-turns`}>
              <h3 id={`${titleId}-turns`} className="mb-4 text-sm uppercase tracking-[0.18em] text-[#fff8d8]">
                Turn Cards
              </h3>
              <div className="space-y-5">
                {details.turns.map((turn, turnIndex) => (
                  <div key={turnIndex} className="pixel-game-panel-inset p-4">
                    <h4 className="mb-3 text-xs uppercase tracking-[0.16em] text-[#f2c14e]">
                      Turn {turnIndex + 1}
                    </h4>
                    <div className="overflow-x-auto">
                      <ArenaRuneRow runes={turn} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section aria-labelledby={`${titleId}-loot`} className="border-t-4 border-[#141313] pt-6">
              <h3 id={`${titleId}-loot`} className="mb-4 text-sm uppercase tracking-[0.18em] text-[#fff8d8]">
                Possible Loot
              </h3>
              {details.loot.length > 0 ? (
                <div className="overflow-x-auto">
                  <ArenaRuneRow runes={details.loot} />
                </div>
              ) : (
                <div className="pixel-game-panel-inset border-dashed px-6 py-8 text-center text-xs uppercase tracking-[0.14em] text-[#b5d3bd]">
                  No card loot
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
