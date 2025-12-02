/**
 * SoloGameBoard - solo mode game board layout
 */

import type { GameBoardSharedProps, SoloVariantData } from './GameBoardFrame';
import { RuneforgesAndCenter } from './Center/RuneforgesAndCenter';
import { PlayerView } from './Player/PlayerView';
import { SoloStats } from './Player/SoloStats';
import { SoloGameOverModal } from './SoloGameOverModal';

interface SoloBoardContentProps {
  shared: GameBoardSharedProps;
  variantData: SoloVariantData;
}

export function SoloBoardContent({ shared, variantData }: SoloBoardContentProps) {
  const {
    borderColor,
    sectionPadding,
    players,
    currentPlayerIndex,
    currentPlayerId,
    selectedRuneType,
    hasSelectedRunes,
    gameMode,
    playerFrozenLines,
    playerLockedLines,
    playerHiddenPatternSlots,
    playerHiddenFloorSlots,
    runeforges,
    centerPool,
    runeTypeCount,
    isDraftPhase,
    isAITurn,
    voidEffectPending,
    frostEffectPending,
    selectedRunes,
    draftSource,
    animatingRuneIds,
    hiddenCenterRuneIds,
    onRuneClick,
    onCenterRuneClick,
    onVoidRuneforgeRuneSelect,
    onVoidCenterRuneSelect,
    onCancelSelection,
    onCancelVoidSelection,
    onPlaceRunes,
    onPlaceRunesInFloor,
    round,
    isGameOver,
    returnToStartScreen,
  } = shared;
  const { soloOutcome, soloRuneScore, soloStats, runePowerTotal, soloTargetScore } = variantData;

  return (
    <>
      <div
        style={{
          flex: 1,
          padding: `${sectionPadding}px`,
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PlayerView
            player={players[0]}
            isActive={currentPlayerIndex === 0}
            onPlaceRunes={currentPlayerIndex === 0 ? onPlaceRunes : undefined}
            onPlaceRunesInFloor={currentPlayerIndex === 0 ? onPlaceRunesInFloor : undefined}
            selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
            canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
            onCancelSelection={onCancelSelection}
            gameMode={gameMode}
            frozenPatternLines={playerFrozenLines}
            lockedPatternLines={playerLockedLines}
            hiddenSlotKeys={playerHiddenPatternSlots}
            hiddenFloorSlotIndexes={playerHiddenFloorSlots}
            round={round}
            hideStatsPanel={true}
            soloRuneScore={soloRuneScore || undefined}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: `${sectionPadding}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <RuneforgesAndCenter
            runeforges={runeforges}
            centerPool={centerPool}
            players={players}
            runeTypeCount={runeTypeCount}
            currentPlayerId={currentPlayerId}
            onRuneClick={onRuneClick}
            onCenterRuneClick={onCenterRuneClick}
            onVoidRuneforgeRuneSelect={onVoidRuneforgeRuneSelect}
            onVoidCenterRuneSelect={onVoidCenterRuneSelect}
            isDraftPhase={isDraftPhase}
            hasSelectedRunes={hasSelectedRunes}
            isAITurn={isAITurn}
            voidEffectPending={voidEffectPending}
            frostEffectPending={frostEffectPending}
            selectedRunes={selectedRunes}
            draftSource={draftSource}
            onCancelSelection={onCancelSelection}
            onCancelVoidSelection={onCancelVoidSelection}
            animatingRuneIds={animatingRuneIds}
            hiddenCenterRuneIds={hiddenCenterRuneIds}
            hideOpponentRow={true}
          />
          {soloStats && (
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                pointerEvents: 'none',
                zIndex: 8,
              }}
            >
              <div
                style={{
                  pointerEvents: 'auto',
                  padding: '10px 12px',
                  borderRadius: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  background: 'rgba(8, 10, 24, 0.9)',
                  boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
                  maxWidth: '520px',
                }}
              >
                <SoloStats {...soloStats} />
              </div>
            </div>
          )}

          {isGameOver && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 100,
                width: 'auto',
              }}
            >
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
      </div>
    </>
  );
}
