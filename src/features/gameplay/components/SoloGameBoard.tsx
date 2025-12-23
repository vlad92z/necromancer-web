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
    totalDeckSize,
    onSelectDeckDraftRuneforge,
    onOpenDeckOverlay,
    onOpenOverloadOverlay,
    onOpenSettings,
    startNextSoloGame,
  } = gameData;

  return (
    <div className="flex flex-col h-full relative">
      <div>
        <GameMetadataView
          gameNumber={game}
          strainValue={strain}
          arcaneDust={arcaneDust}
          runeScore={runeScore ?? { currentScore: 0, targetScore: 0 }}
          deckCount={playerStats?.deckCount ?? player.deck.length}
          overloadedRuneCount={playerStats?.overloadedRuneCount ?? 0}
          canOverload={hasSelectedRunes}
          onOpenOverload={onOpenOverloadOverlay}
          onOpenDeck={onOpenDeckOverlay}
          onOpenSettings={onOpenSettings}
          isSettingsActive={activeElement?.type === 'settings'}
          isOverloadActive={activeElement?.type === 'overload'}
          isDeckActive={activeElement?.type === 'deck'}
          onPlaceRunesInFloor={onPlaceRunesInFloor}
          hasSelectedRunes={hasSelectedRunes}
          selectedRunes={selectedRunes}
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
          game={game}
          targetScore={targetScore}
          onReturnToStart={returnToStartScreen}
        />
      )}
    </div>
  );
});
