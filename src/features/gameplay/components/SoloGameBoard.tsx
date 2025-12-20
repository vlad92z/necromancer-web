/**
 * SoloGameBoard - solo mode game board layout
 */

import { memo } from 'react';
import type { GameContainerSharedProps, GameData } from './GameContainer';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
import { GameMetadataView } from './Center/GameMetadataView';
import { PlayerHandView } from './PlayerHandView';
import { PatternLines } from './Player/PatternLines';
import { ScoringWall } from './Player/ScoringWall';

interface SoloGameViewProps {
  shared: GameContainerSharedProps;
  gameData: GameData;
}

export const SoloGameView = memo(function SoloGameView({ shared, gameData }: SoloGameViewProps) {
  const {
    activeElement,
    isGameOver,
  } = shared;
  const {
    arcaneDustReward,
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
      <GameMetadataView
        onOpenOverload={onOpenOverloadOverlay}
        onOpenDeck={onOpenDeckOverlay}
        onOpenSettings={onOpenSettings}
        activeElement={activeElement?.type}
      />
      <div className="flex h-full items-center flex-row p-5 gap-5">
          <PatternLines/>
          <ScoringWall/>
      </div>
      <PlayerHandView />
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

      { isGameOver && (<SoloGameOverModal/>)}
    </div>
  );
});
