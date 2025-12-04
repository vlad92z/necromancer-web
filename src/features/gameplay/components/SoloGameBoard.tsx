/**
 * SoloGameBoard - solo mode game board layout
 */

import type { GameBoardSharedProps, SoloVariantData } from './GameBoardFrame';
import { DraftingTable } from './Center/DraftingTable';
import { PlayerView } from './Player/PlayerView';
import { SoloStats } from './Player/SoloStats';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';

interface SoloBoardContentProps {
  shared: GameBoardSharedProps;
  variantData: SoloVariantData;
}

export function SoloBoardContent({ shared, variantData }: SoloBoardContentProps) {
  const {
    players,
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
  const { soloOutcome, soloRuneScore, soloStats, runePowerTotal, soloTargetScore, deckDraftState, isDeckDrafting, onSelectDeckDraftRuneforge } = variantData;

  return (
    <div className="grid h-full relative" style={{ gridTemplateColumns: 'minmax(360px, 1.1fr) 1.9fr' }}>
      <div
        className="p-6 border-r flex items-center justify-center relative border-r-[rgba(148,163,184,0.35)] bg-[radial-gradient(circle_at_45%_25%,rgba(86,27,176,0.12),transparent_60%)]"
      >
        <div className="w-full h-full relative">
          <DraftingTable
            runeforges={runeforges}
            centerPool={centerPool}
            player={players[0]}
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
            player={players[0]}
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
          />
        </div>
        {soloStats && (
          <div className="w-full flex justify-center">
            <div
              className="py-2.5 px-3 rounded-2xl border w-full max-w-[640px]"
              style={{ borderColor: 'rgba(148, 163, 184, 0.35)', background: 'rgba(8, 10, 24, 0.9)', boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)' }}
            >
              <SoloStats {...soloStats} />
            </div>
          </div>
        )}
      </div>

      {isDeckDrafting && deckDraftState && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-[rgba(4,2,12,0.75)] backdrop-blur-sm px-4">
          <DeckDraftingModal
            draftState={deckDraftState}
            onSelectRuneforge={onSelectDeckDraftRuneforge}
            currentTarget={soloTargetScore}
            nextTarget={soloTargetScore + 100}
            currentDeckSize={players[0].deck.length}
          />
        </div>
      )}

      {isGameOver && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-auto">
          <SoloGameOverModal
            player={players[0]}
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
