/**
 * SoloGameBoard - solo mode game board layout
 */

import { memo } from 'react';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
import { GameMetadataView } from './Center/GameMetadataView';
import { useGameplayStatusState } from '../../../hooks/useGameState';
import { EnemyPanel } from './EnemyPanel';
import { ScoringWall } from './Player/ScoringWall';
import { EndTurnButton } from './EndTurnButton';
import { TooltipView } from './Player/TooltipView';

interface SoloGameViewProps {
  hiddenWallSlots: Set<string>;
}

export const SoloGameView = memo(function SoloGameView({
  hiddenWallSlots,
}: SoloGameViewProps) {
  const { isDefeat, deckDraftState } = useGameplayStatusState();

  return (
    <div className="flex flex-col h-full relative">
      <div>
        <GameMetadataView/>
      </div>

      <div className="grid flex-1 gap-[14px] px-[min(1.2vmin,16px)] py-[min(1.2vmin,16px)]" style={{ gridTemplateColumns: 'minmax(320px, 0.9fr) 1.6fr' }}>
        <EnemyPanel />

        <section className="flex h-full min-h-0 flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/35 p-5">
          <div className="flex flex-1 items-start justify-center overflow-visible">
            <ScoringWall hiddenWallSlots={hiddenWallSlots} />
          </div>

          <div className="min-h-[220px] rounded-lg border border-sky-300/20 bg-sky-950/10 px-5 py-4">
            <TooltipView />
          </div>
        </section>
      </div>
      <EndTurnButton />
      { deckDraftState && (<DeckDraftingModal draftState={deckDraftState}/>)}
      { isDefeat && (<SoloGameOverModal/>)}
    </div>
  );
});
