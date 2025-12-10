/**
 * SoloGameBoard - solo mode game board layout
 */

import type { GameBoardSharedProps, GameData } from './GameBoardFrame';
import { DraftingTable } from './Center/DraftingTable';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
import { PlayerBoard } from './Player/PlayerBoard';

interface BoardContentProps {
  shared: GameBoardSharedProps;
  gameData?: GameData;
}

export function BoardContent({ shared, gameData }: BoardContentProps) {
  const {
    player,
    selectedRuneType,
    hasSelectedRunes,
    playerHiddenPatternSlots,//TODO this vs playerLocked?
    playerLockedLines,
    runeforges,
    centerPool,
    activeArtefactIds,
    isDraftPhase,
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
    isGameOver,
    returnToStartScreen,
    runesPerRuneforge,
  } = shared;
  // `gameData` may be undefined at runtime (caller sometimes omits it).
  // Guard the destructuring to avoid runtime TypeError.
  const effectiveGameData = gameData;

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
    onStartNextGame,
  } = effectiveGameData ?? ({} as Partial<GameData>);

  return (
    <div className="grid h-full relative" style={{ gridTemplateColumns: 'minmax(360px, 1fr) 2.2fr'}}>
      <div
        className="p-6 border-r flex items-center justify-center relative border-r-[rgba(148,163,184,0.35)] bg-[radial-gradient(circle_at_45%_25%,rgba(86,27,176,0.12),transparent_60%)]"
      >
        <div className="w-full h-full relative">
          <DraftingTable
            runeforges={runeforges}
            centerPool={centerPool}
            onRuneClick={onRuneClick}
            onCenterRuneClick={onCenterRuneClick}
            isDraftPhase={isDraftPhase}
            hasSelectedRunes={hasSelectedRunes}
            selectedRunes={selectedRunes}
            draftSource={draftSource}
            runeforgeDraftStage={runeforgeDraftStage}
            onCancelSelection={onCancelSelection}
            animatingRuneIds={animatingRuneIds}
            hiddenCenterRuneIds={hiddenCenterRuneIds}
            runesPerRuneforge={runesPerRuneforge}
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
                  onOpenDeck={onOpenDeckOverlay}
                  onOpenOverload={onOpenOverloadOverlay}
                  onOpenSettings={onOpenSettings}
                  game={game}
                  arcaneDust={arcaneDust}
                  activeArtefactIds={activeArtefactIds}
                />
        </div>
      </div>

      {isDeckDrafting && deckDraftState && onSelectDeckDraftRuneforge && onOpenDeckOverlay && onStartNextGame && arcaneDustReward != null && (
          
            <DeckDraftingModal
            draftState={deckDraftState}
            onSelectRuneforge={onSelectDeckDraftRuneforge}
            onOpenDeckOverlay={onOpenDeckOverlay}
            currentDeckSize={player.deck.length}
            arcaneDustReward={arcaneDustReward}
            onStartNextGame={onStartNextGame}
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
}
