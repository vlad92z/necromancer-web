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
import { addArcaneDust, getArcaneDust, getArcaneDustReward } from '../utils/arcaneDust';
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
    const savedChapter = savedState?.chapter ?? 0;
    return Math.max(storedBest, savedChapter);
  });
  const [arcaneDust, setArcaneDust] = useState<number>(() => getArcaneDust());
  const loadArtefactState = useArtefactStore((state) => state.loadArtefactState);
  const updateArcaneDust = useArtefactStore((state) => state.updateArcaneDust);

  useEffect(() => {
    setNavigationCallback(() => navigate('/solo'));
    prepareSoloMode();
    loadArtefactState();

    return () => {
      setNavigationCallback(null);
    };
  }, [navigate, prepareSoloMode, loadArtefactState]);

  useEffect(() => {
    let lastCompletionSignature: string | null = null;

    const unsubscribe = useGameplayStore.subscribe((state) => {
      const persistableState = selectPersistableSoloState(state);
      if (persistableState.gameStarted) {
        saveSoloState(persistableState);
        setHasSavedSoloRun(true);
        setLongestSoloRun((previousBest) => {
          const nextBest = Math.max(previousBest, persistableState.chapter);
          if (nextBest === previousBest) {
            return previousBest;
          }
          return updateLongestSoloRun(nextBest);
        });
      }

      const completionAchieved =
        state.soloOutcome === 'victory' &&
        (state.turnPhase === 'game-over' || state.turnPhase === 'deck-draft');

      if (completionAchieved) {
        const completionSignature = `${state.soloOutcome}-${state.turnPhase}-${state.chapter}`;
        if (completionSignature !== lastCompletionSignature) {
          const reward = getArcaneDustReward(state.chapter);
          if (reward > 0) {
            const newDust = addArcaneDust(reward);
            setArcaneDust(newDust);
            updateArcaneDust(newDust);
          }
          lastCompletionSignature = completionSignature;
        }
      } else {
        lastCompletionSignature = null;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [updateArcaneDust]);

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
