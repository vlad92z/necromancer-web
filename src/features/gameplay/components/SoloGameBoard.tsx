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
    draftSource,
    runeforgeDraftStage,
    onRuneClick,
    onCancelSelection,
    onPlaceRunes,
    lockedPatternLines,
    game,
    strain,
    isGameOver,
    returnToStartScreen,
  } = shared;
  const {
    outcome,
    runePowerTotal,
    targetScore,
    arcaneDustReward,
    deckDraftState,
    isDeckDrafting,
    totalDeckSize,
    onSelectDeckDraftRuneforge,
    startNextSoloGame,
  } = gameData;

  return (
    <div className="flex flex-col h-full relative">
      <div>
        <GameMetadataView />
      </div>

      <div className="grid flex-1 gap-[14px] px-[min(1.2vmin,16px)] mt-[min(1.2vmin,16px)]" style={{ gridTemplateColumns: 'minmax(360px, 1fr) 2.2fr' }}>
        <RuneSelectionTable
          onRuneClick={onRuneClick}
          draftSource={draftSource}
          runeforgeDraftStage={runeforgeDraftStage}
          onCancelSelection={onCancelSelection}
        />


        <PlayerBoard
          onPlaceRunes={onPlaceRunes}
          onCancelSelection={onCancelSelection}
          strain={strain}
          lockedPatternLines={lockedPatternLines}
        />
      </div>
      {/* TODO: Cleanup */}
      {isDeckDrafting && deckDraftState && onSelectDeckDraftRuneforge && startNextSoloGame && arcaneDustReward != null && (

        <DeckDraftingModal
          draftState={deckDraftState}
          onSelectRuneforge={onSelectDeckDraftRuneforge}
          totalDeckSize={totalDeckSize}
          arcaneDustReward={arcaneDustReward}
          startNextSoloGame={startNextSoloGame}
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
