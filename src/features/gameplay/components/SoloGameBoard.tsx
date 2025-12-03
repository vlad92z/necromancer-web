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
    players,
    currentPlayerIndex,
    currentPlayerId,
    selectedRuneType,
    hasSelectedRunes,
    playerLockedLines,
    playerHiddenPatternSlots,
    playerHiddenFloorSlots,
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
  const { soloOutcome, soloRuneScore, soloStats, runePowerTotal, soloTargetScore } = variantData;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(360px, 1.1fr) 1.9fr',
        gridTemplateRows: '1fr',
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: `24px`,
          borderRight: `1px solid rgba(148, 163, 184, 0.35)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: 'radial-gradient(circle at 45% 25%, rgba(86, 27, 176, 0.12), transparent 60%)',
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
            isDraftPhase={isDraftPhase}
            hasSelectedRunes={hasSelectedRunes}
            selectedRunes={selectedRunes}
            draftSource={draftSource}
            onCancelSelection={onCancelSelection}
            animatingRuneIds={animatingRuneIds}
            hiddenCenterRuneIds={hiddenCenterRuneIds}
            hideOpponentRow={true}
          />
        </div>
      </div>

      <div
        style={{
          padding: `24px`,
          display: 'grid',
          gridTemplateRows: '1fr auto',
          alignItems: 'center',
          justifyItems: 'center',
          gap: '14px',
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
            hiddenSlotKeys={playerHiddenPatternSlots}
            hiddenFloorSlotIndexes={playerHiddenFloorSlots}
            round={round}
            soloRuneScore={soloRuneScore || undefined}
          />
        </div>
        {soloStats && (
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '16px',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: 'rgba(8, 10, 24, 0.9)',
                boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
                maxWidth: '640px',
                width: '100%',
              }}
            >
              <SoloStats {...soloStats} />
            </div>
          </div>
        )}
      </div>

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
  );
}
