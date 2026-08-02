import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useGameplayActions } from '../../../../hooks/useGameActions';
import { useGameplayDeckState, useGameplayHealthState, useSoloMapState } from '../../../../hooks/useGameState';
import { useClickSound } from '../../../../hooks/useClickSound';
import { compareRunesByRarityThenId } from '../../../../utils/runeRarity';
import { SACRIFICIAL_ALTAR_HEALTH_COST } from '../../../../utils/sacrificialAltar';
import { getCurrentMapLocationEvent } from '../../../../utils/soloMap';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
import { CardView } from '../Player/CardView';

export function SacrificialAltarModal(): ReactElement | null {
  const map = useSoloMapState();
  const { fullDeck } = useGameplayDeckState();
  const { health, maxHealth } = useGameplayHealthState();
  const { sacrificeCardAtAltar, skipSacrificialAltar } = useGameplayActions();
  const playClickSound = useClickSound();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const skipButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [selectedRuneId, setSelectedRuneId] = useState<string | null>(null);
  const event = getCurrentMapLocationEvent(map);
  const isOpen = event?.kind === 'sacrificial-altar' && !event.cleared;
  const sortedRunes = useMemo(
    () => [...fullDeck].sort(compareRunesByRarityThenId),
    [fullDeck],
  );
  const cards = useMemo(() => buildRuneTooltipCards(sortedRunes), [sortedRunes]);
  const canSacrifice = selectedRuneId !== null && health > SACRIFICIAL_ALTAR_HEALTH_COST;

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    skipButtonRef.current?.focus({ preventScroll: true });

    return () => {
      const fallback = document.querySelector<HTMLElement>('[data-map-current="true"]');
      const target = previousFocusRef.current?.isConnected ? previousFocusRef.current : fallback;
      target?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSkip = () => {
    playClickSound();
    skipSacrificialAltar();
  };

  const handleSacrifice = () => {
    if (!selectedRuneId || !canSacrifice) return;
    playClickSound();
    sacrificeCardAtAltar(selectedRuneId);
  };

  const handleKeyDown = (keyboardEvent: KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      handleSkip();
      return;
    }
    if (keyboardEvent.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (keyboardEvent.shiftKey && document.activeElement === first) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="pixel-modal-backdrop absolute inset-0 z-90 flex items-center justify-center px-4 py-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sacrificial-altar-title"
        aria-describedby="sacrificial-altar-description"
        className="pixel-modal flex max-h-[92%] w-[min(1100px,94%)] flex-col overflow-hidden p-2 font-pixel"
        onKeyDown={handleKeyDown}
      >
        <div className="pixel-modal__inner flex min-h-0 flex-1 flex-col p-6">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-[#141313] pb-4">
            <div>
              <h2 id="sacrificial-altar-title" className="pixel-section-title text-2xl">
                Sacrificial Altar
              </h2>
              <p id="sacrificial-altar-description" className="mt-3 text-xs text-[#b5d3bd]">
                Sacrifice {SACRIFICIAL_ALTAR_HEALTH_COST} health to delete one card from your deck.
              </p>
            </div>
            <div className="pixel-game-stat px-4 py-3 text-xs text-[#fff8d8]">
              Health: {health} / {maxHealth}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto py-5 pr-2">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
              {sortedRunes.map((rune, index) => {
                const card = cards[index];
                if (!card) return null;
                return (
                  <div key={rune.id} className="flex h-54 items-center justify-center">
                    <CardView
                      title={card.title}
                      imageSrc={card.imageSrc}
                      manaCost={card.manaCost}
                      description={card.description}
                      runeTypes={card.runeTypes}
                      variant={card.variant}
                      size="compact"
                      isSelected={selectedRuneId === rune.id}
                      onClick={() => {
                        playClickSound();
                        setSelectedRuneId((selected) => selected === rune.id ? null : rune.id);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {health <= SACRIFICIAL_ALTAR_HEALTH_COST && (
            <p className="mb-3 text-center text-xs text-[#e15f4f]">
              You need more than {SACRIFICIAL_ALTAR_HEALTH_COST} health to make a sacrifice.
            </p>
          )}
          <footer className="flex justify-end gap-3 border-t-4 border-[#141313] pt-4">
            <button
              ref={skipButtonRef}
              type="button"
              onClick={handleSkip}
              className="pixel-game-button !bg-[#efe7c3] px-5 py-3 text-xs tracking-[0.16em] !text-[#171518]"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={!canSacrifice}
              onClick={handleSacrifice}
              className="pixel-game-button !bg-[#e15f4f] px-5 py-3 text-xs tracking-[0.16em] text-[#fff8d8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sacrifice
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
