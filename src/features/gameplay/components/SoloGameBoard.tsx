/**
 * SoloGameBoard - solo mode game board layout
 */

import { memo } from 'react';
import type { GameBoardSharedProps, GameData } from './GameBoardFrame';
import { RuneSelectionTable } from './Center/RuneSelectionTable';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
import { GameMetadataView } from './Center/GameMetadataView';
import { PlayerBoard } from './Player/PlayerBoard';

interface SoloGameBoardProps {
  shared: GameBoardSharedProps;
  gameData: GameData;
}

export const SoloGameBoard = memo(function SoloGameBoard({ shared, gameData }: SoloGameBoardProps) {
  const {
    player,
    selectedRuneType,
    hasSelectedRunes,
    playerHiddenPatternSlots,//TODO this vs playerLocked?
    playerLockedLines,
    runeforges,
    centerPool,
    selectedRunes,
    draftSource,
    runeforgeDraftStage,
    animatingRuneIds,
    onRuneClick,
    onCancelSelection,
    onPlaceRunes,
    onPlaceRunesInFloor,
    game,
    strain,
    isGameOver,
    returnToStartScreen,
    runesPerRuneforge,
  } = shared;
  const {
    outcome,
    runeScore,
    playerStats,
    runePowerTotal,
    targetScore,
    arcaneDustReward,
    arcaneDust,
    deckDraftState,
    isDeckDrafting,
    onSelectDeckDraftRuneforge,
    onOpenDeckOverlay,
    onOpenOverloadOverlay,
    onOpenSettings,
    startNextSoloGame,
  } = gameData;

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-[min(1.2vmin,16px)] pt-[min(1.2vmin,16px)]">
        <GameMetadataView
          playerId={player.id}
          gameNumber={game}
          strainValue={strain}
          arcaneDust={arcaneDust}
          runeScore={runeScore ?? { currentScore: 0, targetScore: 0 }}
          health={player.health}
          armor={player.armor}
          maxHealth={player.maxHealth ?? player.health}
          deckCount={playerStats?.deckCount ?? player.deck.length}
          overloadedRuneCount={playerStats?.overloadedRuneCount ?? 0}
          canOverload={hasSelectedRunes}
          onOpenOverload={onOpenOverloadOverlay}
          onOpenDeck={onOpenDeckOverlay}
          onOpenSettings={onOpenSettings}
          onPlaceRunesInFloor={onPlaceRunesInFloor}
          hasSelectedRunes={hasSelectedRunes}
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
          runeforgeDraftStage={runeforgeDraftStage}
          onCancelSelection={onCancelSelection}
          animatingRuneIds={animatingRuneIds}
          runesPerRuneforge={runesPerRuneforge}
        />


        <PlayerBoard
          player={player}
          onPlaceRunes={onPlaceRunes}
          onPlaceRunesInFloor={onPlaceRunesInFloor}
          selectedRuneType={selectedRuneType}
          canPlace={hasSelectedRunes}
          onCancelSelection={onCancelSelection}
          lockedLineIndexes={playerLockedLines}
          hiddenSlotKeys={playerHiddenPatternSlots}
          runeScore={runeScore ?? { currentScore: 0, targetScore: 0 }} //TODO?
        />
      </div>
      {/* TODO: Cleanup */}
      {isDeckDrafting && deckDraftState && onSelectDeckDraftRuneforge && onOpenDeckOverlay && startNextSoloGame && arcaneDustReward != null && (

        <DeckDraftingModal
          draftState={deckDraftState}
          onSelectRuneforge={onSelectDeckDraftRuneforge}
          onOpenDeckOverlay={onOpenDeckOverlay}
          currentDeckSize={player.deck.length}
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
