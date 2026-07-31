/**
 * Solo route - entry point for Solo mode runs
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigationCallback } from '../systems/gameplayOrchestrator';
import { subscribeGameplayState } from '../state/stores/gameplayState';
import { GameContainer } from '../features/gameplay/components/GameContainer';
import { useArtefactActions, useGameplayActions } from '../hooks/useGameActions';
import { useGameStarted, useSoloStartArtefactState } from '../hooks/useGameState';
import { hasSavedSoloState, loadSoloState, clearSoloState, getLongestSoloRun, updateLongestSoloRun } from '../utils/soloPersistence';
import { ArtefactsView, type ArtefactsViewHandle } from '../components/ArtefactsView';
import { ClickSoundButton } from '../components/ClickSoundButton';
import { useClickSound } from '../hooks/useClickSound';

type SoloStartAction = 'back' | 'manage' | 'continue' | 'new';

export function SoloStartScreen() {
  const navigate = useNavigate();
  const gameStarted = useGameStarted();
  const { startSoloRun, prepareSoloMode, hydrateGameState } = useGameplayActions();
  const [hasSavedSoloRun, setHasSavedSoloRun] = useState<boolean>(() => hasSavedSoloState());
  const [longestSoloRun, setLongestSoloRun] = useState<number>(() => {
    const storedBest = getLongestSoloRun();
    const savedState = loadSoloState();
    const savedGame = savedState?.gameIndex ?? 0;
    return Math.max(storedBest, savedGame);
  });
  const { loadArtefactState } = useArtefactActions();
  const { selectedArtefactIds } = useSoloStartArtefactState();
  const playClickSound = useClickSound();

  const [showArtefactsModal, setShowArtefactsModal] = useState(false);
  const [activeElement, setActiveElement] = useState<SoloStartAction | null>(null);
  const artefactsRef = useRef<ArtefactsViewHandle | null>(null);
  const buttonRefs = useRef<Record<SoloStartAction, HTMLButtonElement | null>>({
    back: null,
    manage: null,
    continue: null,
    new: null,
  });

  useEffect(() => {
    setNavigationCallback(() => navigate('/solo'));
    prepareSoloMode();
    loadArtefactState();

    return () => {
      setNavigationCallback(null);
    };
  }, [navigate, prepareSoloMode, loadArtefactState]);

  useEffect(() => {
    const unsubscribe = subscribeGameplayState((state) => {
      // Keep the start-screen best-run badge in sync with gameplay progression.
      setLongestSoloRun((previousBest) => {
        const nextBest = Math.max(previousBest, state.longestRun ?? 0, state.gameIndex ?? 0);
        if (nextBest === previousBest) {
          return previousBest;
        }
        return updateLongestSoloRun(nextBest);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // When the board returns to the start screen, re-check storage to ensure the Continue CTA reflects reality.
  useEffect(() => {
    if (!gameStarted) {
      setHasSavedSoloRun(hasSavedSoloState());
    }
  }, [gameStarted]);

  const handleStartSolo = useCallback(
    () => {
      startSoloRun();
    },
    [startSoloRun],
  );

  const handleContinueSolo = useCallback(() => {
    const savedState = loadSoloState();
    if (!savedState) {
      clearSoloState();
      setHasSavedSoloRun(false);
      return;
    }
    hydrateGameState(savedState);
  }, [hydrateGameState]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleManage = useCallback(() => {
    setShowArtefactsModal(true);
  }, []);

  useEffect(() => {
    setActiveElement((current) => {
      if (current === 'continue' && !hasSavedSoloRun) {
        return 'new';
      }
      return current;
    });
  }, [hasSavedSoloRun]);

  const selectAction = useCallback((action: SoloStartAction) => {
    setActiveElement(action);
    buttonRefs.current[action]?.focus();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const order: SoloStartAction[] = hasSavedSoloRun
      ? ['back', 'continue', 'new', 'manage']
      : ['back', 'new', 'manage'];

    const moveSelection = (direction: 'up' | 'down') => {
      if (activeElement === null) {
        selectAction(order[0]);
        playClickSound();
        return;
      }

      const currentIndex = order.indexOf(activeElement);
      const offset = direction === 'down' ? 1 : -1;
      const nextIndex = (currentIndex + offset + order.length) % order.length;
      const next = order[nextIndex];
      if (next !== activeElement) {
        selectAction(next);
        playClickSound();
      }
    };

    const triggerAction = (target: SoloStartAction) => {
      switch (target) {
        case 'back':
          handleBack();
          return;
        case 'manage':
          handleManage();
          return;
        case 'continue':
          handleContinueSolo();
          return;
        case 'new':
          handleStartSolo();
          return;
        default:
          return;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (showArtefactsModal) {
        artefactsRef.current?.handleKeyDown(event);
        return;
      }

      if (gameStarted) {
        return;
      }
      
      switch (event.key) {
        case 'ArrowUp': {
          event.preventDefault();
          moveSelection('up');
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          moveSelection('down');
          break;
        }
        case 'Enter':
        case ' ': // Space
        case 'Spacebar': {
          event.preventDefault();
          if (activeElement === null) {
            selectAction(order[0]);
            playClickSound();
          } else {
            playClickSound();
            triggerAction(activeElement);
          }
          break;
        }
        case 'Escape': {
          event.preventDefault();
          playClickSound();
          handleBack();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeElement, gameStarted, handleBack, handleContinueSolo, handleManage, handleStartSolo, hasSavedSoloRun, playClickSound, selectAction, showArtefactsModal]);

  if (gameStarted) {
    return <GameContainer/>;
  }

  return (
    <main className="pixel-screen relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div aria-hidden="true" className="absolute left-[6%] top-[12%] h-4 w-4 bg-[#e15f4f] shadow-[16px_0_0_#e15f4f,0_16px_0_#e15f4f]" />
      <div aria-hidden="true" className="absolute bottom-[16%] right-[8%] h-4 w-4 bg-[#5dc6b0] shadow-[-16px_0_0_#5dc6b0,0_-16px_0_#5dc6b0]" />

      <div className="relative w-full max-w-140">
        <div className="flex items-center justify-between gap-4">
          <ClickSoundButton
            ref={(element) => { buttonRefs.current.back = element; }}
            title="← Back"
            action={handleBack}
            className="pixel-button pixel-button--utility pixel-button--compact w-auto"
            isActive={activeElement === 'back'}
            onFocus={(event) => {
              if (event.currentTarget.matches(':focus-visible')) setActiveElement('back');
            }}
            onPointerDown={() => setActiveElement(null)}
          />
          {longestSoloRun > 2 && (
            <div className="font-pixel flex items-center gap-3 text-[10px] uppercase text-[#b5d3bd]">
              <span>Longest Run</span>
              <span className="text-lg text-[#f2c14e]">{longestSoloRun - 1}</span>
            </div>
          )}
        </div>

        <section className="pixel-panel mt-5 p-2">
          <div className="pixel-panel-inset space-y-4 px-6 py-7 text-center md:px-10 md:py-9">
            <h1 className="font-pixel text-4xl uppercase leading-[0.95] text-[#fff8d8] [text-shadow:4px_4px_0_#141313] md:text-5xl">Solo Run</h1>
          </div>
        </section>

        <div className="mt-5">
          <div className="flex w-full flex-col gap-4">
            {hasSavedSoloRun && (
              <ClickSoundButton
                ref={(element) => { buttonRefs.current.continue = element; }}
                title="Continue Run"
                action={handleContinueSolo}
                className="pixel-button pixel-button--utility"
                isActive={activeElement === 'continue'}
                onFocus={(event) => {
                  if (event.currentTarget.matches(':focus-visible')) setActiveElement('continue');
                }}
                onPointerDown={() => setActiveElement(null)}
              />
            )}
            <ClickSoundButton
              ref={(element) => { buttonRefs.current.new = element; }}
              title="New Game"
              action={handleStartSolo}
              className="pixel-button pixel-button--primary"
              isActive={activeElement === 'new'}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) setActiveElement('new');
              }}
              onPointerDown={() => setActiveElement(null)}
            />
          </div>
        </div>

        {/* <section className="pixel-control mt-5 space-y-4 p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div className="font-pixel text-xs uppercase tracking-[0.18em] text-[#fff8d8]">Artefacts</div>
            <ClickSoundButton
              ref={(element) => { buttonRefs.current.manage = element; }}
              title="Manage"
              action={handleManage}
              className="pixel-button pixel-button--utility pixel-button--compact w-auto"
              isActive={activeElement === 'manage'}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) setActiveElement('manage');
              }}
              onPointerDown={() => setActiveElement(null)}
            />
          </div>
          {selectedArtefactIds.length > 0 && (
            <div className="border-4 border-[#141313] bg-[#293532] p-4">
              <ArtefactsRow selectedArtefactIds={selectedArtefactIds} />
            </div>
          )}
        </section> */}
        <p className="font-pixel mt-2 text-center text-[10px] uppercase tracking-[0.08em] text-[#b5d3bd]">↑ ↓ select</p>
      </div>

      {/* Artefacts Modal */}
      <ArtefactsView ref={artefactsRef} isOpen={showArtefactsModal} onClose={() => setShowArtefactsModal(false)} />
    </main>
  );
}
