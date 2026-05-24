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
import { PlayerPanel } from './PlayerPanel';

interface SoloGameViewProps {
  hiddenWallSlots: Set<string>;
}

export const SoloGameView = memo(function SoloGameView({
  hiddenWallSlots,
}: SoloGameViewProps) {
  const { isDefeat, deckDraftState } = useGameplayStatusState();

  return (
    <div className="flex h-full flex-col relative">
      <div>
        <GameMetadataView/>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[14px] px-[min(1.2vmin,16px)] py-[min(1.2vmin,16px)]">
        <div
          className="grid min-h-0 flex-1 gap-[14px]"
          style={{ gridTemplateColumns: 'minmax(280px, 0.92fr) minmax(520px, 1.55fr) minmax(280px, 0.92fr)' }}
        >
          <PlayerPanel />

          <section className="flex h-full min-h-0 items-start justify-center overflow-visible rounded-lg border border-white/10 bg-slate-950/35 p-5">
            <ScoringWall hiddenWallSlots={hiddenWallSlots} />
          </section>

          <EnemyPanel />
        </div>

        <section className="relative flex min-h-[240px] flex-col rounded-lg border border-sky-300/20 bg-sky-950/10 px-4 py-3">
          <div className="flex min-h-0 flex-1 items-center">
            <TooltipView />
          </div>
          <EndTurnButton className="absolute bottom-3 right-4 z-20" />
        </section>
      </div>
      { deckDraftState && (<DeckDraftingModal draftState={deckDraftState}/>)}
      { isDefeat && (<SoloGameOverModal/>)}
    </div>
  );
});
