/**
 * DuelGameBoard - duel mode game board layout
 */

// import type { DuelVariantData, GameBoardProps, GameBoardSharedProps } from './GameBoardFrame';
// import { OpponentView } from './Player/OpponentView';
// import { RuneforgesAndCenter } from './Center/RuneforgesAndCenter';
// import { GameOverModal } from './GameOverModal';
// import { PlayerView } from './Player/PlayerView';

// interface DuelBoardContentProps {
//   shared: GameBoardSharedProps;
//   variantData: DuelVariantData;
// }

// function DuelBoardContent({ shared, variantData }: DuelBoardContentProps) {
//   const {
//     players,
//     currentPlayerIndex,
//     currentPlayerId,
//     selectedRuneType,
//     hasSelectedRunes,
//     opponentLockedLines,
//     playerHiddenPatternSlots,
//     opponentHiddenPatternSlots,
//     playerHiddenFloorSlots,
//     runeforges,
//     centerPool,
//     runeTypeCount,
//     isDraftPhase,
//     selectedRunes,
//     draftSource,
//     animatingRuneIds,
//     hiddenCenterRuneIds,
//     onRuneClick,
//     onCenterRuneClick,
//     onCancelSelection,
//     onPlaceRunes,
//     onPlaceRunesInFloor,
//     round,
//     isGameOver,
//     returnToStartScreen,
//   } = shared;
//   const { winner } = variantData;

//   return (
//     <>
//       <div
//         style={{
//           flex: 1,
//           padding: `24px`,
//           borderBottom: `1px solid rgba(148, 163, 184, 0.35)`,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}
//       >
//         <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <OpponentView
//             opponent={players[1]}
//             isActive={currentPlayerIndex === 1}
//             lockedPatternLines={opponentLockedLines}
//             hiddenSlotKeys={opponentHiddenPatternSlots}
//             round={round}
//           />
//         </div>
//       </div>

//       <div
//         style={{
//           flex: 1,
//           padding: `24px`,
//           borderBottom: `1px solid rgba(148, 163, 184, 0.35)`,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           position: 'relative',
//         }}
//       >
//         <div style={{ width: '100%', height: '100%', position: 'relative' }}>
//           <RuneforgesAndCenter
//             runeforges={runeforges}
//             centerPool={centerPool}
//             players={players}
//             runeTypeCount={runeTypeCount}
//             currentPlayerId={currentPlayerId}
//             onRuneClick={onRuneClick}
//             onCenterRuneClick={onCenterRuneClick}
//             isDraftPhase={isDraftPhase}
//             hasSelectedRunes={hasSelectedRunes}
//             selectedRunes={selectedRunes}
//             draftSource={draftSource}
//             onCancelSelection={onCancelSelection}
//             animatingRuneIds={animatingRuneIds}
//             hiddenCenterRuneIds={hiddenCenterRuneIds}
//             hideOpponentRow={false}
//           />

//           {isGameOver && (
//             <div
//               style={{
//                 position: 'absolute',
//                 top: '50%',
//                 left: '50%',
//                 transform: 'translate(-50%, -50%)',
//                 zIndex: 100,
//                 width: 'auto',
//               }}
//             >
//               <GameOverModal players={players} winner={winner} onReturnToStart={returnToStartScreen} />
//             </div>
//           )}
//         </div>
//       </div>

//       <div
//         style={{
//           flex: 1,
//           padding: `24px`,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}
//       >
//         <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <PlayerView
//             player={players[0]}
//             isActive={currentPlayerIndex === 0}
//             onPlaceRunes={currentPlayerIndex === 0 ? onPlaceRunes : undefined}
//             onPlaceRunesInFloor={currentPlayerIndex === 0 ? onPlaceRunesInFloor : undefined}
//             selectedRuneType={currentPlayerIndex === 0 ? selectedRuneType : null}
//             canPlace={currentPlayerIndex === 0 && hasSelectedRunes}
//             onCancelSelection={onCancelSelection}
//             hiddenSlotKeys={playerHiddenPatternSlots}
//             hiddenFloorSlotIndexes={playerHiddenFloorSlots}
//             round={round}
//           />
//         </div>
//       </div>
//     </>
//   );
// }

export function DuelGameBoard() {
  return (
    <div> </div>
    // <GameBoardFrame
    //   gameState={gameState}
    //   variant="duel"
    //   renderContent={(shared, variantData) => {
    //     if (variantData.type !== 'duel') {
    //       return null;
    //     }
    //     return <DuelBoardContent shared={shared} variantData={variantData} />;
    //   }}
    // />
  );
}
