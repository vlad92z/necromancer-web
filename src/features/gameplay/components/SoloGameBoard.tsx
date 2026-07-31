/**
 * SoloGameBoard - solo mode game board layout
 */

import { memo, useCallback, useState } from 'react';
import type { Rune } from '../../../types/game';
import { SoloGameOverModal } from './SoloGameOverModal';
import { DeckDraftingModal } from './DeckDraftingModal';
import { GameMetadataView } from './Center/GameMetadataView';
import { useCombatEnemyState, useGameplayStatusState } from '../../../hooks/useGameState';
import { EnemyPanel } from './EnemyPanel';
import { ScoringWall } from './Player/ScoringWall';
import { EndTurnButton } from './EndTurnButton';
import { TooltipView } from './Player/TooltipView';
import { PlayerPanel } from './PlayerPanel';
import { EnemySpellBoard } from './EnemySpellBoard';
import { SoloVictoryModal } from './SoloVictoryModal';

interface SoloGameViewProps {
  hiddenWallSlots: Set<string>;
}

export const SoloGameView = memo(function SoloGameView({
  hiddenWallSlots,
}: SoloGameViewProps) {
  const { isDefeat, isVictory, deckDraftState } = useGameplayStatusState();
  const { enemy } = useCombatEnemyState();
  const [hoveredPlayerRune, setHoveredPlayerRune] = useState<Rune | null>(null);
  const [hoveredEnemyRune, setHoveredEnemyRune] = useState<Rune | null>(null);
  const clearHoveredPlayerRune = useCallback(() => setHoveredPlayerRune(null), []);
  const clearHoveredEnemyRune = useCallback(() => setHoveredEnemyRune(null), []);

  return (
    <div className="relative flex h-full flex-col font-pixel">
      <div>
        <GameMetadataView/>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3.5 px-[min(1.2vmin,16px)] py-[min(1.2vmin,16px)]">
        <div
          className="grid min-h-0 flex-1 gap-3.5"
          style={{
            gridTemplateColumns: enemy?.isBoss
              ? '220px minmax(410px, 1fr) minmax(410px, 1fr) 280px'
              : '220px minmax(440px, 1fr) minmax(440px, 1fr) 220px',
          }}
        >
          <PlayerPanel hoveredRune={hoveredPlayerRune} />

          <section className="flex h-full min-h-0 items-start justify-center overflow-visible p-5">
            <ScoringWall
              hiddenWallSlots={hiddenWallSlots}
              onRuneHover={setHoveredPlayerRune}
              onRuneLeave={clearHoveredPlayerRune}
            />
          </section>

          <section className="flex h-full min-h-0 items-start justify-center overflow-visible p-5">
            <EnemySpellBoard
              onRuneHover={setHoveredEnemyRune}
              onRuneLeave={clearHoveredEnemyRune}
            />
          </section>

          <EnemyPanel hoveredRune={hoveredEnemyRune} />
        </div>

        <section className="relative flex min-h-60 flex-col px-4 py-3">
          <div className="flex min-h-0 flex-1 items-center">
            <TooltipView />
          </div>
          <EndTurnButton className="absolute bottom-3 right-4 z-20" />
        </section>
      </div>
      { deckDraftState && (<DeckDraftingModal draftState={deckDraftState}/>)}
      { isDefeat && (<SoloGameOverModal/>)}
      { isVictory && (<SoloVictoryModal/>)}
    </div>
  );
});
