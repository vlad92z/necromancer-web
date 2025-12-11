/**
 * Solo route - entry point for Solo mode runs
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameplayStore } from '../state/stores/gameplayStore';
import { setNavigationCallback, useGameplayStore } from '../state/stores/gameplayStore';
import { GameBoardFrame } from '../features/gameplay/components/GameBoardFrame';
import type { GameState, RunConfig } from '../types/game';
import { hasSavedSoloState, loadSoloState, saveSoloState, clearSoloState, getLongestSoloRun, updateLongestSoloRun } from '../utils/soloPersistence';
import { useArtefactStore } from '../state/stores/artefactStore';
import { useShallow } from 'zustand/react/shallow';
import { DEFAULT_SOLO_CONFIG } from '../utils/gameInitialization';
import { gradientButtonClasses, simpleButtonClasses } from '../styles/gradientButtonClasses';
import { ArtefactsView } from '../components/ArtefactsView';
import { ArtefactsRow } from '../components/ArtefactsRow';
import arcaneDustIcon from '../assets/stats/arcane_dust.png';
import { ClickSoundButton } from '../components/ClickSoundButton';

const selectPersistableSoloState = (state: GameplayStore): GameState => {
  const {
    ...gameState
  } = state;

  return gameState as GameState;
};

const selectGameBoardState = (state: GameplayStore): GameState => state;

export function SoloStartScreen() {
  const navigate = useNavigate();
  const gameStarted = useGameplayStore((state) => state.gameStarted);
  const startSoloRun = useGameplayStore((state) => state.startSoloRun);
  const prepareSoloMode = useGameplayStore((state) => state.prepareSoloMode);
  const hydrateGameState = useGameplayStore((state) => state.hydrateGameState);
  const gameState = useGameplayStore(useShallow(selectGameBoardState));
  const [hasSavedSoloRun, setHasSavedSoloRun] = useState<boolean>(() => hasSavedSoloState());
  const [longestSoloRun, setLongestSoloRun] = useState<number>(() => {
    const storedBest = getLongestSoloRun();
    const savedState = loadSoloState();
    const savedGame = savedState?.game ?? 0;
    return Math.max(storedBest, savedGame);
  });
  const loadArtefactState = useArtefactStore((state) => state.loadArtefactState);
  const arcaneDust = useArtefactStore((state) => state.arcaneDust);

  const [showArtefactsModal, setShowArtefactsModal] = useState(false);
  const formattedDust = arcaneDust.toLocaleString();
  const selectedArtefactIds = useArtefactStore((state) => state.selectedArtefactIds);

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
      if (persistableState.outcome === 'defeat') {
        clearSoloState();
        setHasSavedSoloRun(false);
      }

      // Always update the local `longestSoloRun` if store's longestRun or game increased.
      setLongestSoloRun((previousBest) => {
        const nextBest = Math.max(previousBest, persistableState.longestRun ?? 0, persistableState.game ?? 0);
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

  const handleStartSolo = (config: RunConfig) => {
    startSoloRun(config);
  };

  const handleContinueSolo = () => {
    const savedState = loadSoloState();
    if (!savedState) {
      clearSoloState();
      setHasSavedSoloRun(false);
      return;
    }
    hydrateGameState(savedState);
  };

  if (gameStarted) {
    return <GameBoardFrame gameState={gameState} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1024] px-6 py-6 text-slate-100">
      <div className="w-[min(1100px,_94vw)] min-h-[calc(min(1100px,_94vw)_*_2/3)] space-y-4 rounded-2xl border border-slate-700/40 bg-[linear-gradient(145deg,_rgba(17,24,39,0.95),_rgba(30,41,59,0.85))] px-8 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between gap-4">
          <ClickSoundButton
            title="← Back"
            action={() => navigate('/')}
            className="rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-sky-300 transition-colors hover:text-sky-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
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
              action={() => setShowArtefactsModal(true)}
              className="rounded-xl border border-purple-500/30 bg-purple-900/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-purple-300 transition hover:border-purple-400 hover:bg-purple-900/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400"
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
              className={gradientButtonClasses}
            />
          )}
          <ClickSoundButton
            title="New Game"
            action={() => handleStartSolo(DEFAULT_SOLO_CONFIG)}
            className={hasSavedSoloRun ? simpleButtonClasses : gradientButtonClasses}
          />
        </div>
      </div>

      {/* Artefacts Modal */}
      <ArtefactsView isOpen={showArtefactsModal} onClose={() => setShowArtefactsModal(false)} />
    </div>
  );
}
