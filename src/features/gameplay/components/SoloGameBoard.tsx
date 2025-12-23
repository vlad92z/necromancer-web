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
    player,
    selectedRuneType,
    hasSelectedRunes,
    playerHiddenPatternSlots,//TODO this vs playerLocked?
    runeforges,
    centerPool,
    selectedRunes,
    draftSource,
    activeElement,
    runeforgeDraftStage,
    animatingRuneIds,
    onRuneClick,
    onCancelSelection,
    onPlaceRunes,
    game,
    strain,
    isGameOver,
    returnToStartScreen,
    runesPerRuneforge,
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
        <GameMetadataView
          isSettingsActive={activeElement?.type === 'settings'}
          isOverloadActive={activeElement?.type === 'overload'}
        />
      </div>

      <div className="grid flex-1 gap-[14px] px-[min(1.2vmin,16px)] mt-[min(1.2vmin,16px)]" style={{ gridTemplateColumns: 'minmax(360px, 1fr) 2.2fr' }}>
        <RuneSelectionTable
          runeforges={runeforges}
          centerPool={centerPool}
          onRuneClick={onRuneClick}
          hasSelectedRunes={hasSelectedRunes}
          selectedRunes={selectedRunes}
          draftSource={draftSource}
          activeElement={activeElement}
          runeforgeDraftStage={runeforgeDraftStage}
          onCancelSelection={onCancelSelection}
          animatingRuneIds={animatingRuneIds}
          runesPerRuneforge={runesPerRuneforge}
        />


        <PlayerBoard
          player={player}
          onPlaceRunes={onPlaceRunes}
          selectedRuneType={selectedRuneType}
          canPlace={hasSelectedRunes}
          onCancelSelection={onCancelSelection}
          hiddenSlotKeys={playerHiddenPatternSlots}
          selectedRunes={selectedRunes}
          strain={strain}
          activeElement={activeElement}
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
