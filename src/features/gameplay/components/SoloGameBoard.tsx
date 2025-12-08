/**
 * SoloGameBoard - solo mode game board layout
 */

import type { GameBoardSharedProps, GameData } from './GameBoardFrame';
import { DraftingTable } from './Center/DraftingTable';
import { PlayerView } from './Player/PlayerView';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';

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
    activeArtefactIds,
    selectedRunes,
    draftSource,
    animatingRuneIds,
    onRuneClick,
    onAllRuneforgesClick,
    onCancelSelection,
    onPlaceRunes,
    onPlaceRunesInFloor,
    game,
    isGameOver,
    returnToStartScreen,
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
    <div className="grid h-full relative" style={{ gridTemplateColumns: 'minmax(360px, 1.1fr) 1.9fr' }}>
      <div
        className="p-6 border-r flex items-center justify-center relative border-r-[rgba(148,163,184,0.35)] bg-[radial-gradient(circle_at_45%_25%,rgba(86,27,176,0.12),transparent_60%)]"
      >
        <div className="w-full h-full relative">
          <DraftingTable
            runeforges={runeforges}
            player={player}
            onRuneClick={onRuneClick}
            onAllRuneforgesClick={onAllRuneforgesClick}
            hasSelectedRunes={hasSelectedRunes}
            selectedRunes={selectedRunes}
            draftSource={draftSource}
            onCancelSelection={onCancelSelection}
            animatingRuneIds={animatingRuneIds}
          />
        </div>
      </div>

      <div className="p-6 grid items-center justify-items-center gap-3.5" style={{ gridTemplateRows: '1fr auto' }}>
        <div className="w-full h-full flex items-center justify-center">
          <PlayerView
            player={player}
            onPlaceRunes={onPlaceRunes}
            onPlaceRunesInFloor={onPlaceRunesInFloor}
            selectedRuneType={selectedRuneType}
            canPlace={hasSelectedRunes}
            onCancelSelection={onCancelSelection}
            lockedPatternLines={playerLockedLines}
            hiddenSlotKeys={playerHiddenPatternSlots}
            game={game}
            runeScore={runeScore ?? { currentScore: 0, targetScore: 0 }}
            deckCount={playerStats?.deckCount}
            strain={playerStats?.overloadMultiplier}
            onOpenDeck={onOpenDeckOverlay}
            onOpenOverload={onOpenOverloadOverlay}
            onOpenSettings={onOpenSettings}
            arcaneDust={arcaneDust}
            activeArtefactIds={activeArtefactIds}
          />
        </div>
      </div>

      {isDeckDrafting && deckDraftState && onSelectDeckDraftRuneforge && onOpenDeckOverlay && onStartNextGame && arcaneDustReward != null && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-[rgba(4,2,12,0.75)] backdrop-blur-sm px-4">
          <DeckDraftingModal
            draftState={deckDraftState}
            onSelectRuneforge={onSelectDeckDraftRuneforge}
            onOpenDeckOverlay={onOpenDeckOverlay}
            currentDeckSize={player.deck.length}
            arcaneDustReward={arcaneDustReward}
            onStartNextGame={onStartNextGame}
          />
        </div>
      )}

      {isGameOver && outcome != null && runePowerTotal != null && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-auto">
          <SoloGameOverModal
            outcome={outcome}
            runePowerTotal={runePowerTotal}
            game={game}
            targetScore={targetScore}
            onReturnToStart={returnToStartScreen}
          />
        </div>
      )}
    </div>
  );
}
