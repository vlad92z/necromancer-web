/**
 * Solo route - entry point for Solo mode runs
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SoloBoardContent } from '../features/gameplay/components/SoloGameBoard';
import { SoloStartScreen } from '../features/gameplay/components/SoloStartScreen';
import { setNavigationCallback, useGameplayStore } from '../state/stores/gameplayStore';
import { GameBoardFrame } from '../features/gameplay/components/GameBoardFrame';
import type { RuneTypeCount, SoloRunConfig } from '../types/game';

export function Solo() {
  const navigate = useNavigate();
  const gameStarted = useGameplayStore((state) => state.gameStarted);
  const matchType = useGameplayStore((state) => state.matchType);
  const startSoloRun = useGameplayStore((state) => state.startSoloRun);
  const prepareSoloMode = useGameplayStore((state) => state.prepareSoloMode);
  const runeTypeCount = useGameplayStore((state) => state.runeTypeCount);
  const gameState = useGameplayStore();

  useEffect(() => {
    setNavigationCallback(() => navigate('/'));
    if (matchType !== 'solo') {
      prepareSoloMode(runeTypeCount);
    }

    return () => {
      setNavigationCallback(null);
    };
  }, [navigate, matchType, prepareSoloMode, runeTypeCount]);

  const handleStartSolo = (runeTypeCount: RuneTypeCount, config: SoloRunConfig) => {
    startSoloRun(runeTypeCount, config);
  };

  if (!gameStarted || matchType !== 'solo') {
    return <SoloStartScreen onStartSolo={handleStartSolo} />;
  }

  return <GameBoardFrame
        gameState={gameState}
        variant="solo"
        renderContent={(shared, variantData) => {
          return <SoloBoardContent shared={shared} variantData={variantData} />;
        }}
      />;
}
