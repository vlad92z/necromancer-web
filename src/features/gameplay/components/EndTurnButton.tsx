/**
 * EndTurnButton - advances the redesigned combat turn cycle.
 */

import { Button } from '../../../components/layout';
import { useGameplayActions } from '../../../hooks/useGameActions';
import { useCombatEnemyState, useGameplayStatusState, usePendingRuneTargetState } from '../../../hooks/useGameState';

interface EndTurnButtonProps {
  className?: string;
}

export function EndTurnButton({ className = '' }: EndTurnButtonProps) {
  const { endCombatTurn } = useGameplayActions();
  const { combatPhase } = useCombatEnemyState();
  const { isDefeat, deckDraftState } = useGameplayStatusState();
  const pendingTarget = usePendingRuneTargetState();
  const isEnabled = combatPhase === 'player-turn' && !isDefeat && !deckDraftState && !pendingTarget;

  return (
    <div className={className}>
      <Button
        type="button"
        variant="secondary"
        size="large"
        disabled={!isEnabled}
        title={isEnabled ? 'End turn' : 'End Turn is unavailable'}
        onClick={endCombatTurn}
        className="pixel-game-button min-w-37.5 rounded-none !border-4 !border-[#141313] !bg-[#efe7c3] px-5 py-4 text-xs !text-[#171518] tracking-[0.16em] hover:!bg-[#d9d2a6]"
      >
        End Turn
      </Button>
    </div>
  );
}
