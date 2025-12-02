/**
 * DuelGameBoard - duel mode game board layout
 */

import type { DuelVariantData, GameBoardProps, GameBoardSharedProps } from './GameBoardFrame';
import { GameBoardFrame } from './GameBoardFrame';
import { OpponentView } from './Player/OpponentView';
import { RuneforgesAndCenter } from './Center/RuneforgesAndCenter';
import { GameOverModal } from './GameOverModal';
import { PlayerView } from './Player/PlayerView';

interface DuelBoardContentProps {
  shared: GameBoardSharedProps;
  variantData: DuelVariantData;
}

function DuelBoardContent({ shared, variantData }: DuelBoardContentProps) {
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
    opponentFrozenLines,
    playerLockedLines,
    opponentLockedLines,
    playerHiddenPatternSlots,
    opponentHiddenPatternSlots,
    playerHiddenFloorSlots,
    opponentHiddenFloorSlots,
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
    canFreezeOpponentPatternLine,
    onFreezePatternLine,
    onCancelFreezeSelection,
    round,
    isGameOver,
    returnToStartScreen,
  } = shared;
  const { winner } = variantData;

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
          <OpponentView
            opponent={players[1]}
            isActive={currentPlayerIndex === 1}
            gameMode={gameMode}
            frozenPatternLines={opponentFrozenLines}
            lockedPatternLines={opponentLockedLines}
            freezeSelectionEnabled={canFreezeOpponentPatternLine}
            onFreezePatternLine={canFreezeOpponentPatternLine ? onFreezePatternLine : undefined}
            onCancelFreezeSelection={onCancelFreezeSelection}
            hiddenSlotKeys={opponentHiddenPatternSlots}
            hiddenFloorSlotIndexes={opponentHiddenFloorSlots}
            round={round}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: `${sectionPadding}px`,
          borderBottom: `1px solid ${borderColor}`,
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
            hideOpponentRow={false}
          />

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
              <GameOverModal players={players} winner={winner} onReturnToStart={returnToStartScreen} />
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: `${sectionPadding}px`,
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
          />
        </div>
      </div>
    </>
  );
}

export function DuelGameBoard({ gameState }: GameBoardProps) {
  return (
    <GameBoardFrame
      gameState={gameState}
      variant="duel"
      renderContent={(shared, variantData) => {
        if (variantData.type !== 'duel') {
          return null;
        }
        return <DuelBoardContent shared={shared} variantData={variantData} />;
      }}
    />
  );
}
