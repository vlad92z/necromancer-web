/**
 * SoloGameBoard - solo mode game board layout
 */

import type { GameBoardSharedProps, SoloVariantData } from './GameBoardFrame';
import { DraftingTable } from './Center/DraftingTable';
import { PlayerView } from './Player/PlayerView';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';

interface SoloBoardContentProps {
  shared: GameBoardSharedProps;
  variantData: SoloVariantData;
}

export function SoloBoardContent({ shared, variantData }: SoloBoardContentProps) {
  const {
    player,
    currentPlayerIndex,
    selectedRuneType,
    hasSelectedRunes,
    playerHiddenPatternSlots,
    playerHiddenFloorSlots,
    playerLockedLines,
    runeforges,
    centerPool,
    runeTypeCount,
    isDraftPhase,
    selectedRunes,
    draftSource,
    animatingRuneIds,
    hiddenCenterRuneIds,
    onRuneClick,
    onCenterRuneClick,
    onCancelSelection,
    onPlaceRunes,
    onPlaceRunesInFloor,
    round,
    isGameOver,
    returnToStartScreen,
  } = shared;
  const {
    soloOutcome,
    soloRuneScore,
    soloStats,
    runePowerTotal,
    soloTargetScore,
    deckDraftState,
    isDeckDrafting,
    onSelectDeckDraftRuneforge,
    onOpenDeckOverlay,
    onStartNextGame,
  } = variantData;

  return (
    <div className="grid h-full relative" style={{ gridTemplateColumns: 'minmax(360px, 1.1fr) 1.9fr' }}>
      <div
        className="p-6 border-r flex items-center justify-center relative border-r-[rgba(148,163,184,0.35)] bg-[radial-gradient(circle_at_45%_25%,rgba(86,27,176,0.12),transparent_60%)]"
      >
        <div className="w-full h-full relative">
          <DraftingTable
            runeforges={runeforges}
            centerPool={centerPool}
            player={player}
            runeTypeCount={runeTypeCount}
            onRuneClick={onRuneClick}
            onCenterRuneClick={onCenterRuneClick}
            isDraftPhase={isDraftPhase}
            hasSelectedRunes={hasSelectedRunes}
            selectedRunes={selectedRunes}
            draftSource={draftSource}
            onCancelSelection={onCancelSelection}
            animatingRuneIds={animatingRuneIds}
            hiddenCenterRuneIds={hiddenCenterRuneIds}
          />
        </div>
      </div>

      <div className="p-6 grid items-center justify-items-center gap-3.5" style={{ gridTemplateRows: '1fr auto' }}>
        <div className="w-full h-full flex items-center justify-center">
          <PlayerView
            player={player}
            isActive={currentPlayerIndex === 0}
            onPlaceRunes={currentPlayerIndex === 0 ? onPlaceRunes : undefined}
            onPlaceRunesInFloor={currentPlayerIndex === 0 ? onPlaceRunesInFloor : undefined}
            selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
            canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
            onCancelSelection={onCancelSelection}
            lockedPatternLines={playerLockedLines}
            hiddenSlotKeys={playerHiddenPatternSlots}
            hiddenFloorSlotIndexes={playerHiddenFloorSlots}
            round={round}
            soloRuneScore={soloRuneScore || undefined}
            deckCount={soloStats?.deckCount}
            strain={soloStats?.overloadMultiplier}
            onOpenDeck={onOpenDeckOverlay}
          />
        </div>
      </div>

      {isDeckDrafting && deckDraftState && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-[rgba(4,2,12,0.75)] backdrop-blur-sm px-4">
          <DeckDraftingModal
            draftState={deckDraftState}
            onSelectRuneforge={onSelectDeckDraftRuneforge}
            onOpenDeckOverlay={onOpenDeckOverlay}
            currentDeckSize={player.deck.length}
            onStartNextGame={onStartNextGame}
          />
        </div>
      )}

      {isGameOver && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-auto">
          <SoloGameOverModal
            player={player}
            outcome={soloOutcome}
            runePowerTotal={runePowerTotal}
            round={round}
            targetScore={soloTargetScore}
            onReturnToStart={returnToStartScreen}
          />
        </div>
      )}
    </div>
  );
}
