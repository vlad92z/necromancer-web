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

          <div className="flex min-h-[128px] items-center justify-center rounded-lg border border-dashed border-sky-300/25 bg-sky-950/20 px-5 py-4 text-center">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/70">Hand</div>
              <div className="mt-2 text-lg font-bold text-sky-100">Hand coming in Stage 3</div>
            </div>
          </div>
        </section>
      </div>
      <EndTurnButton />
      { deckDraftState && (<DeckDraftingModal draftState={deckDraftState}/>)}
      { isDefeat && (<SoloGameOverModal/>)}
    </div>
  );
});
