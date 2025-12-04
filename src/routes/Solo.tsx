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
import type { GameState, RuneTypeCount, SoloRunConfig } from '../types/game';
import { hasSavedSoloState, loadSoloState, saveSoloState, clearSoloState } from '../utils/soloPersistence';

const selectPersistableSoloState = (state: GameplayStore): GameState => {
  const {
    ...gameState
  } = state;

  return gameState as GameState;
};

export function Solo() {
  const navigate = useNavigate();
  const gameStarted = useGameplayStore((state) => state.gameStarted);
  const matchType = useGameplayStore((state) => state.matchType);
  const startSoloRun = useGameplayStore((state) => state.startSoloRun);
  const prepareSoloMode = useGameplayStore((state) => state.prepareSoloMode);
  const hydrateGameState = useGameplayStore((state) => state.hydrateGameState);
  const runeTypeCount = useGameplayStore((state) => state.runeTypeCount);
  const gameState = useGameplayStore();
  const [hasSavedSoloRun, setHasSavedSoloRun] = useState<boolean>(() => hasSavedSoloState());

  useEffect(() => {
    setNavigationCallback(() => navigate('/solo'));
    if (matchType !== 'solo') {
      prepareSoloMode(runeTypeCount);
    }

    return () => {
      setNavigationCallback(null);
    };
  }, [navigate, matchType, prepareSoloMode, runeTypeCount]);

  useEffect(() => {
    const unsubscribe = useGameplayStore.subscribe((state) => {
      const persistableState = selectPersistableSoloState(state);
      if (persistableState.matchType === 'solo' && persistableState.gameStarted) {
        saveSoloState(persistableState);
        setHasSavedSoloRun(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStartSolo = (runeTypeCount: RuneTypeCount, config: SoloRunConfig) => {
    startSoloRun(runeTypeCount, config);
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

  if (!gameStarted || matchType !== 'solo') {
    return <SoloStartScreen onStartSolo={handleStartSolo} onContinueSolo={handleContinueSolo} canContinue={hasSavedSoloRun} />;
  }

  return <GameBoardFrame
        gameState={gameState}
        variant="solo"
        renderContent={(shared, variantData) => {
          return <SoloBoardContent shared={shared} variantData={variantData} />;
        }}
      />;
}
