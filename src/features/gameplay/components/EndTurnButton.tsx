/**
 * EndTurnButton - advances the redesigned combat turn cycle.
 */

import { Button } from '../../../components/layout';
import { useGameplayActions } from '../../../hooks/useGameActions';
import { useCombatEnemyState, useGameplayStatusState } from '../../../hooks/useGameState';

export function EndTurnButton() {
  const { endCombatTurn } = useGameplayActions();
  const { combatPhase } = useCombatEnemyState();
  const { isDefeat, deckDraftState } = useGameplayStatusState();
  const isEnabled = combatPhase === 'player-turn' && !isDefeat && !deckDraftState;

  return (
    <div className="absolute bottom-5 right-5">
      <Button
        type="button"
        variant="secondary"
        size="large"
        disabled={!isEnabled}
        title={isEnabled ? 'End turn' : 'End Turn is unavailable'}
        onClick={endCombatTurn}
        className="min-w-[150px] border-amber-300/40 bg-amber-500/15 text-amber-100"
      >
        End Turn
      </Button>
    </div>
  );
}
