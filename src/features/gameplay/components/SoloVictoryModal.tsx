import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useGameplayActions } from '../../../hooks/useGameActions';
import { useClickSound } from '../../../hooks/useClickSound';

export function SoloVictoryModal() {
  const { returnToStartScreen } = useGameplayActions();
  const playClickSound = useClickSound();
  const backButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    backButtonRef.current?.focus();
  }, []);

  const closeToMenu = () => {
    playClickSound();
    returnToStartScreen();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeToMenu();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      backButtonRef.current?.focus();
    }
  };

  return (
    <div className="pixel-modal-backdrop absolute inset-0 z-100 flex items-center justify-center px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="solo-victory-title"
        className="pixel-modal min-w-105 p-2 text-center font-pixel"
        onKeyDown={handleKeyDown}
      >
        <div className="pixel-modal__inner px-7 py-8">
          <div className="pixel-game-stat mb-4 bg-[#5b8c5a] px-3.5 py-2 text-xs uppercase tracking-[0.12em] text-[#fff8d8]">
            Victory
          </div>
          <h2 id="solo-victory-title" className="pixel-section-title mb-5 text-xl">
            Golem Lord defeated
          </h2>
          <p className="mb-6 text-xs text-[#b5d3bd]">Greenwood is safe.</p>
          <button
            ref={backButtonRef}
            type="button"
            onClick={closeToMenu}
            className="pixel-game-button w-full px-4 py-4 text-xs tracking-[0.08em]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
