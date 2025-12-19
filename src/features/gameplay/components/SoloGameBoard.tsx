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
import { useGameplayStore } from '../../../state/stores';
import { PlayerHandView } from './PlayerHandView';

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
    playerLockedLines,
    runeforges,
    selectedRunes,
    draftSource,
    activeElement,
    runeforgeDraftStage,
    onRuneClick,
    onCancelSelection,
    onPlaceRunes,
    overloadDamage,
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
    onOpenDeckOverlay,
    onOpenOverloadOverlay,
    onOpenSettings,
    startNextSoloGame,
  } = gameData;

  const gameIndex = useGameplayStore((state) => state.gameIndex);
  return (
    <div className="flex flex-col h-full relative">
      <GameMetadataView
        onOpenOverload={onOpenOverloadOverlay}
        onOpenDeck={onOpenDeckOverlay}
        onOpenSettings={onOpenSettings}
        activeElement={activeElement?.type}
      />

      <div className="grid flex-1 gap-[14px] px-[min(1.2vmin,16px)] mt-[min(1.2vmin,16px)]" style={{ gridTemplateColumns: 'minmax(360px, 1fr) 2.2fr' }}>
        {/* <RuneSelectionTable
          runeforges={runeforges}
          onRuneClick={onRuneClick}
          hasSelectedRunes={hasSelectedRunes}
          selectedRunes={selectedRunes}
          draftSource={draftSource}
          activeElement={activeElement}
          runeforgeDraftStage={runeforgeDraftStage}
          onCancelSelection={onCancelSelection}
        /> */}


        <PlayerBoard
          player={player}
          onPlaceRunes={onPlaceRunes}
          selectedRuneType={selectedRuneType}
          canPlace={hasSelectedRunes}
          onCancelSelection={onCancelSelection}
          lockedLineIndexes={playerLockedLines}
          hiddenSlotKeys={playerHiddenPatternSlots}
          selectedRunes={selectedRunes}
          overloadDamage={overloadDamage}
          activeElement={activeElement}
        />
      </div>
      <PlayerHandView/>
      {/* TODO: Cleanup */}
      {isDeckDrafting && deckDraftState && onSelectDeckDraftRuneforge && onOpenDeckOverlay && startNextSoloGame && arcaneDustReward != null && (

        <DeckDraftingModal
          draftState={deckDraftState}
          onSelectRuneforge={onSelectDeckDraftRuneforge}
          onOpenDeckOverlay={onOpenDeckOverlay}
          totalDeckSize={totalDeckSize}
          arcaneDustReward={arcaneDustReward}
          startNextSoloGame={startNextSoloGame}
        />
      )}

      {isGameOver && outcome != null && runePowerTotal != null && (
        <SoloGameOverModal
          outcome={outcome}
          runePowerTotal={runePowerTotal}
          gameIndex={gameIndex}
          targetScore={targetScore}
          onReturnToStart={returnToStartScreen}
        />
      )}
    </div>
  );
});
