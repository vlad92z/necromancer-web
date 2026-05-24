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

        <section className="flex min-h-[280px] flex-col rounded-lg border border-sky-300/20 bg-sky-950/10 px-5 py-4">
          <div className="flex items-center justify-between gap-4 border-b border-sky-300/15 pb-4">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/70">Hand</div>
              <div className="mt-1 text-lg font-bold text-sky-50">Rune tray</div>
            </div>
            <EndTurnButton className="shrink-0" />
          </div>

          <div className="flex min-h-0 flex-1 items-center pt-4">
            <TooltipView />
          </div>
        </section>
      </div>
      { deckDraftState && (<DeckDraftingModal draftState={deckDraftState}/>)}
      { isDefeat && (<SoloGameOverModal/>)}
    </div>
  );
});
