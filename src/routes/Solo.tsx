/**
 * Solo route - entry point for Solo mode runs
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SoloBoardContent } from '../features/gameplay/components/SoloGameBoard';
import { SoloStartScreen } from '../features/gameplay/components/SoloStartScreen';
import type { GameplayStore } from '../state/stores/gameplayStore';
import { setNavigationCallback, useGameplayStore } from '../state/stores/gameplayStore';
import { GameBoardFrame } from '../features/gameplay/components/GameBoardFrame';
import type { GameState, SoloRunConfig } from '../types/game';
import { hasSavedSoloState, loadSoloState, saveSoloState, clearSoloState, getLongestSoloRun, updateLongestSoloRun } from '../utils/soloPersistence';
import { useArtefactStore } from '../state/stores/artefactStore';

const selectPersistableSoloState = (state: GameplayStore): GameState => {
  const {
    ...gameState
  } = state;

  return gameState as GameState;
};

export function Solo() {
  const navigate = useNavigate();
  const gameStarted = useGameplayStore((state) => state.gameStarted);
  const startSoloRun = useGameplayStore((state) => state.startSoloRun);
  const prepareSoloMode = useGameplayStore((state) => state.prepareSoloMode);
  const hydrateGameState = useGameplayStore((state) => state.hydrateGameState);
  const gameState = useGameplayStore();
  const [hasSavedSoloRun, setHasSavedSoloRun] = useState<boolean>(() => hasSavedSoloState());
  const [longestSoloRun, setLongestSoloRun] = useState<number>(() => {
    const storedBest = getLongestSoloRun();
    const savedState = loadSoloState();
    const savedGame = savedState?.game ?? 0;
    return Math.max(storedBest, savedGame);
  });
  const loadArtefactState = useArtefactStore((state) => state.loadArtefactState);
  const arcaneDust = useArtefactStore((state) => state.arcaneDust);

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

  const handleStartSolo = (config: SoloRunConfig) => {
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

  if (!gameStarted) {
    return (
      <SoloStartScreen
        onStartSolo={handleStartSolo}
        onContinueSolo={handleContinueSolo}
        canContinue={hasSavedSoloRun}
        longestRun={longestSoloRun}
        arcaneDust={arcaneDust}
      />
    );
  }

  return <GameBoardFrame
    gameState={gameState}
    renderContent={(shared, variantData) => {
      return <SoloBoardContent shared={shared} variantData={variantData} />;
    }}
  />;
}
