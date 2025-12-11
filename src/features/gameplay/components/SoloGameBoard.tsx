/**
 * SoloGameBoard - solo mode game board layout
 */

import { memo } from 'react';
import type { GameBoardSharedProps, GameData } from './GameBoardFrame';
import { RuneSelectionTable } from './Center/RuneSelectionTable';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
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
    activeArtefactIds,
    isSelectionPhase: isSelectionPhase,
    selectedRunes,
    draftSource,
    runeforgeDraftStage,
    animatingRuneIds,
    hiddenCenterRuneIds,
    onRuneClick,
    onCenterRuneClick,
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
    <div className="grid h-full relative" style={{ gridTemplateColumns: 'minmax(360px, 1fr) 2.2fr'}}>
      <div
        className="p-6 flex items-center justify-center relative"
      >
        <div className="w-full h-full relative">
          <RuneSelectionTable
            runeforges={runeforges}
            centerPool={centerPool}
            onRuneClick={onRuneClick}
            onCenterRuneClick={onCenterRuneClick}
            isSelectionPhase={isSelectionPhase}
            hasSelectedRunes={hasSelectedRunes}
            selectedRunes={selectedRunes}
            draftSource={draftSource}
            runeforgeDraftStage={runeforgeDraftStage}
            onCancelSelection={onCancelSelection}
            animatingRuneIds={animatingRuneIds}
            hiddenCenterRuneIds={hiddenCenterRuneIds}
            runesPerRuneforge={runesPerRuneforge}
            gameNumber={game}
            strainValue={strain}
            arcaneDust={arcaneDust}
            activeArtefactIds={activeArtefactIds}
          />
        </div>
      </div>

      <div className="p-6 grid items-start justify-items-center gap-3.5" style={{ gridTemplateRows: '1fr auto' }}>
        <div className="w-full h-full flex items-start justify-center">
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
                  deckCount={playerStats?.deckCount}
                  strain={playerStats?.overloadMultiplier}
                  overloadedRuneCount={playerStats?.overloadedRuneCount}
                  onOpenDeck={onOpenDeckOverlay}
                  onOpenOverload={onOpenOverloadOverlay}
                  onOpenSettings={onOpenSettings}
                />
        </div>
      </div>

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
