import { useGameplayActions } from '../../../hooks/useGameActions';
import { usePendingRuneTargetState } from '../../../hooks/useGameState';

export function RuneTargetPrompt() {
  const pendingTarget = usePendingRuneTargetState();
  const { skipPendingRuneTarget } = useGameplayActions();
  if (!pendingTarget) return null;

  const isConsume = pendingTarget.effectRef.effectId === 'rune.consume';
  const targetType = pendingTarget.effectRef.runeType ? `${pendingTarget.effectRef.runeType} ` : '';
  const boardLabel = isConsume ? 'your wall' : 'the enemy wall';

  return (
    <div
      className="pixel-message-panel absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 px-5 py-3"
      role="status"
      aria-live="polite"
    >
      <span className="text-xs tracking-[0.08em] text-[#fff8d8]">
        Select a {targetType}Rune on {boardLabel}, or skip this effect.
      </span>
      <button
        type="button"
        className="pixel-game-button min-w-24 px-4 py-3 text-xs tracking-[0.12em]"
        onClick={skipPendingRuneTarget}
      >
        Skip
      </button>
    </div>
  );
}
