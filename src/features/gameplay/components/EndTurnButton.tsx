/**
 * EndTurnButton - advances the redesigned combat turn cycle.
 */

import { Button } from '../../../components/layout';
import { useGameplayActions } from '../../../hooks/useGameActions';
import { useCombatEnemyState, useGameplayStatusState } from '../../../hooks/useGameState';

interface EndTurnButtonProps {
  className?: string;
}

export function EndTurnButton({ className = '' }: EndTurnButtonProps) {
  const { endCombatTurn } = useGameplayActions();
  const { combatPhase } = useCombatEnemyState();
  const { isDefeat, deckDraftState } = useGameplayStatusState();
  const isEnabled = combatPhase === 'player-turn' && !isDefeat && !deckDraftState;

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        size="large"
        disabled={!isEnabled}
        title={isEnabled ? 'End turn' : 'End Turn is unavailable'}
        onClick={endCombatTurn}
        className="pixel-game-button min-w-[150px] rounded-none !bg-[#efe7c3] px-5 py-4 text-xs !text-[#171518] tracking-[0.16em]"
      >
        End Turn
      </Button>
    </div>
  );
}
