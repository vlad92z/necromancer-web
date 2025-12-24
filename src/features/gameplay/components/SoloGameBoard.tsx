/**
 * SoloGameBoard - solo mode game board layout
 */

import { memo } from 'react';
import type { GameContainerSharedProps, GameData } from './GameContainer';
import { RuneSelectionTable } from './Center/RuneSelectionTable';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
import { GameMetadataView } from './Center/GameMetadataView';
import { PlayerBoard } from './Player/PlayerBoard';

interface SoloGameViewProps {
  shared: GameContainerSharedProps;
  gameData: GameData;
}

export const SoloGameView = memo(function SoloGameView({ shared, gameData }: SoloGameViewProps) {
  const {
    game,
    isGameOver,
    returnToStartScreen,
  } = shared;
  const {
    outcome,
    runePowerTotal,
    targetScore,
    deckDraftState,
  } = gameData;

  return (
    <div className="flex flex-col h-full relative">
      <div>
        <GameMetadataView/>
      </div>

      <div className="grid flex-1 gap-[14px] px-[min(1.2vmin,16px)] mt-[min(1.2vmin,16px)]" style={{ gridTemplateColumns: 'minmax(360px, 1fr) 2.2fr' }}>
        <RuneSelectionTable/>
        <PlayerBoard/>
      </div>
      { deckDraftState && (
        <DeckDraftingModal
          draftState={deckDraftState}
          />
      )}

      {isGameOver && outcome != null && runePowerTotal != null && (
        <SoloGameOverModal
          outcome={outcome}
          runePowerTotal={runePowerTotal}
          game={game}
          targetScore={targetScore}
          onReturnToStart={returnToStartScreen}
        />
      )}
    </div>
  );
});
