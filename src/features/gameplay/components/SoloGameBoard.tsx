/**
 * SoloGameBoard - solo mode game board layout
 */

import { GameMetadataView } from './Center/GameMetadataView';
import { PlayerHandView } from './PlayerHandView';
import { EndRoundButton } from './Player/EndRoundButton';
import { PatternLines } from './Player/PatternLines';
import { SpellWallView } from './Player/SpellWallView';

export function SoloGameView() {
  return (
    <div className="flex flex-col h-full relative">
      <GameMetadataView/>
      <div className="flex h-full items-center justify-center flex-row p-5 gap-5">
        <div className="flex h-full items-start">
          <EndRoundButton />
        </div>
        <PatternLines />
        <SpellWallView />
      </div>
      <PlayerHandView />
      {/* TODO: Cleanup */}
      {/* {isDeckDrafting && deckDraftState && onSelectDeckDraftRuneforge && onOpenDeckOverlay && startNextSoloGame && arcaneDustReward != null && ( */}
{/* 
        <DeckDraftingModal
          draftState={deckDraftState}
          onSelectRuneforge={onSelectDeckDraftRuneforge}
          onOpenDeckOverlay={onOpenDeckOverlay}
          totalDeckSize={totalDeckSize}
          arcaneDustReward={arcaneDustReward}
          startNextSoloGame={startNextSoloGame}
        />
      )}

      { isGameOver && (<SoloGameOverModal/>)} */}
    </div>
  );
}
