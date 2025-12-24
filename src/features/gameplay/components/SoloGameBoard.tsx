/**
 * SoloGameBoard - solo mode game board layout
 */

import { memo } from 'react';
import { RuneSelectionTable } from './Center/RuneSelectionTable';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
import { GameMetadataView } from './Center/GameMetadataView';
import { PlayerBoard } from './Player/PlayerBoard';
import { useGameplayStore } from '../../../state/stores';

export const SoloGameView = memo(function SoloGameView() {
  const isDefeat = useGameplayStore((state) => state.isDefeat);
  const deckDraftState = useGameplayStore((state) => state.deckDraftState);

  return (
    <div className="flex flex-col h-full relative">
      <div>
        <GameMetadataView/>
      </div>

      <div className="grid flex-1 gap-[14px] px-[min(1.2vmin,16px)] mt-[min(1.2vmin,16px)]" style={{ gridTemplateColumns: 'minmax(360px, 1fr) 2.2fr' }}>
        <RuneSelectionTable/>
        <PlayerBoard/>
      </div>
      { deckDraftState && (<DeckDraftingModal draftState={deckDraftState}/>)}
      { isDefeat && (<SoloGameOverModal/>)}
    </div>
  );
});
