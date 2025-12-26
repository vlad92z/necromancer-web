/**
 * Solo route - entry point for Solo mode runs
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameplayStore } from '../state/stores/gameplayStore';
import { setNavigationCallback, useGameplayStore } from '../state/stores/gameplayStore';
import { GameContainer } from '../features/gameplay/components/GameContainer';
import type { GameState } from '../types/game';
import { hasSavedSoloState, loadSoloState, saveSoloState, clearSoloState, getLongestSoloRun, updateLongestSoloRun } from '../utils/soloPersistence';
import { useArtefactStore } from '../state/stores/artefactStore';
import { gradientButtonClasses, simpleButtonClasses } from '../styles/gradientButtonClasses';
import { ArtefactsView, type ArtefactsViewHandle } from '../components/ArtefactsView';
import { ArtefactsRow } from '../components/ArtefactsRow';
import arcaneDustIcon from '../assets/stats/arcane_dust.png';
import { ClickSoundButton } from '../components/ClickSoundButton';
import { useClickSound } from '../hooks/useClickSound';

const selectPersistableSoloState = (state: GameplayStore): GameState => {
  const {
    ...gameState
  } = state;

  return gameState as GameState;
};

export function SoloStartScreen() {
  const navigate = useNavigate();
  const gameplayState = useGameplayStore();
  const { gameStarted, startSoloRun, prepareSoloMode, hydrateGameState } = gameplayState;
  const [hasSavedSoloRun, setHasSavedSoloRun] = useState<boolean>(() => hasSavedSoloState());
  const [longestSoloRun, setLongestSoloRun] = useState<number>(() => {
    const storedBest = getLongestSoloRun();
    const savedState = loadSoloState();
    const savedGame = savedState?.gameIndex ?? 0;
    return Math.max(storedBest, savedGame);
  });
  const loadArtefactState = useArtefactStore((state) => state.loadArtefactState);
  const arcaneDust = useArtefactStore((state) => state.arcaneDust);
  const playClickSound = useClickSound();

  const [showArtefactsModal, setShowArtefactsModal] = useState(false);
  const formattedDust = arcaneDust.toLocaleString();
  const selectedArtefactIds = useArtefactStore((state) => state.selectedArtefactIds);
  const [activeElement, setActiveElement] = useState<'back' | 'manage' | 'continue' | 'new'>('back');
  const artefactsRef = useRef<ArtefactsViewHandle | null>(null);

  useEffect(() => {
    setNavigationCallback(() => navigate('/solo'));
    prepareSoloMode();
    loadArtefactState();

    return () => {
      setNavigationCallback(null);
    };
  }, [navigate, prepareSoloMode, loadArtefactState]);

  useEffect(() => {
    const unsubscribe = useGameplayStore.subscribe((state) => {
      const persistableState = selectPersistableSoloState(state);

      // Persist solo state only while a run is active
      if (persistableState.gameStarted) {
        saveSoloState(persistableState);
        setHasSavedSoloRun(true);
      }

      // If run ended in defeat, remove saved run from storage and update UI
      if (persistableState.isDefeat) {
        clearSoloState();
        setHasSavedSoloRun(false);
      }

      // Always update the local `longestSoloRun` if store's longestRun or game increased.
      setLongestSoloRun((previousBest) => {
        const nextBest = Math.max(previousBest, persistableState.longestRun ?? 0, persistableState.gameIndex ?? 0);
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
      return current ?? 'back';
    });
  }, [hasSavedSoloRun]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const order: Array<'back' | 'manage' | 'continue' | 'new'> = hasSavedSoloRun
      ? ['back', 'manage', 'continue', 'new']
      : ['back', 'manage', 'new'];

    const moveSelection = (direction: 'up' | 'down') => {
      setActiveElement((current) => {
        const currentIndex = order.indexOf(current);
        const offset = direction === 'down' ? 1 : -1;
        const nextIndex = (currentIndex + offset + order.length) % order.length;
        const next = order[nextIndex];
        if (next !== current) {
          playClickSound();
        }
        return next;
      });
    };

    const triggerAction = (target: 'back' | 'manage' | 'continue' | 'new') => {
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
      } else if (gameStarted) {
        return;
      }

      if (showArtefactsModal || gameStarted) {
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
        case 'ArrowRight': {
          if (activeElement === 'continue' && hasSavedSoloRun) {
            event.preventDefault();
            setActiveElement((current) => {
              if (current !== 'new') {
                playClickSound();
              }
              return 'new';
            });
          }
          break;
        }
        case 'ArrowLeft': {
          if (activeElement === 'new' && hasSavedSoloRun) {
            event.preventDefault();
            setActiveElement((current) => {
              if (current !== 'continue') {
                playClickSound();
              }
              return 'continue';
            });
          }
          break;
        }
        case 'Enter':
        case ' ': // Space
        case 'Spacebar': {
          event.preventDefault();
          playClickSound();
          triggerAction(activeElement);
          break;
        }
        case 'Escape': {
          console.log('Solo Start Escape pressed');
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
  }, [activeElement, artefactsRef, gameStarted, handleBack, handleContinueSolo, handleManage, handleStartSolo, hasSavedSoloRun, playClickSound, showArtefactsModal]);

  const gradientActive = 'data-[active=true]:from-sky-400 data-[active=true]:to-purple-600 data-[active=true]:-translate-y-0.5';
  const simpleActive = 'data-[active=true]:border-slate-300 data-[active=true]:bg-slate-800';
  const backButtonClasses = 'rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 data-[active=true]:text-sky-100 data-[active=true]:underline';
  const manageButtonClasses = 'rounded-xl border border-purple-500/30 bg-purple-900/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-300 transition hover:border-purple-400 hover:bg-purple-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 data-[active=true]:border-purple-300 data-[active=true]:bg-purple-900/40 data-[active=true]:shadow-[0_0_0_2px_rgba(168,85,247,0.35)]';
  const continueButtonClasses = `${gradientButtonClasses} ${gradientActive} data-[active=true]:border data-[active=true]:border-slate-300`;
  const newGameButtonClasses = hasSavedSoloRun
    ? `${simpleButtonClasses} ${simpleActive}`
    : `${gradientButtonClasses} ${gradientActive}`;

  if (gameStarted) {
    return <GameContainer/>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1024] px-6 py-6 text-slate-100">
      <div className="w-[min(1100px,_94vw)] min-h-[calc(min(1100px,_94vw)_*_2/3)] space-y-4 rounded-2xl border border-slate-700/40 bg-[linear-gradient(145deg,_rgba(17,24,39,0.95),_rgba(30,41,59,0.85))] px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between gap-4">
          <ClickSoundButton
            title="← Back"
            action={handleBack}
            className={backButtonClasses}
            isActive={activeElement === 'back'}
          />
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-bold uppercase tracking-tight text-slate-50">Solo Run</h1>
          <p className="text-base text-slate-300">
            Draft runes to cast increeasingly powerful spells while surviving overload damage
          </p>
          <div className="flex flex-wrap gap-3">
            {longestSoloRun > 2 && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-slate-900/70 px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-sky-100 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                <span className="text-[11px] text-sky-300">Longest Run</span>
                <span className="text-lg font-extrabold text-slate-50">{longestSoloRun - 1}</span>
              </div>
            )}

            {arcaneDust > 0 && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-100/5 px-3 py-2 text-[13px] font-extrabold uppercase tracking-[0.18em] text-amber-100 shadow-[0_12px_28px_rgba(0,0,0,0.45)]">
                <img src={arcaneDustIcon} alt="Arcane Dust" className="h-8 w-8" />
                <span className="text-lg text-amber-200">{formattedDust}</span>
              </div>
            )}
          </div>
        </div>

        {/* Artefacts Section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold uppercase tracking-wider text-slate-200">Artefacts</div>
            <ClickSoundButton
              title="Manage"
              action={handleManage}
              className={manageButtonClasses}
              isActive={activeElement === 'manage'}
            />
          </div>
          {selectedArtefactIds.length > 0 && (
            <div className="rounded-xl border border-slate-600/40 bg-slate-900/50 p-4">
              <ArtefactsRow selectedArtefactIds={selectedArtefactIds} />
            </div>
          )}
        </section>

        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          {hasSavedSoloRun && handleContinueSolo && (
            <ClickSoundButton
              title="Continue Run"
              action={handleContinueSolo}
              className={continueButtonClasses}
              isActive={activeElement === 'continue'}
            />
          )}
          <ClickSoundButton
            title="New Game"
            action={() => handleStartSolo()}
            className={newGameButtonClasses}
            isActive={activeElement === 'new'}
          />
        </div>
      </div>

      {/* Artefacts Modal */}
      <ArtefactsView ref={artefactsRef} isOpen={showArtefactsModal} onClose={() => setShowArtefactsModal(false)} />
    </div>
  );
}
