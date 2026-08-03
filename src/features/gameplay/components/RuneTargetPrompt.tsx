import { usePendingRuneTargetState } from '../../../hooks/useGameState';

export function RuneTargetPrompt() {
  const pendingTarget = usePendingRuneTargetState();
  if (!pendingTarget) return null;

  const targetType = pendingTarget.effectRef.runeType ? `${pendingTarget.effectRef.runeType} ` : '';
  const boardLabel = pendingTarget.effectRef.targetOwner === 'self' ? 'your wall' : 'the enemy wall';
  const count = pendingTarget.effectRef.count;

  return (
    <div
      className="pixel-message-panel absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 px-5 py-3"
      role="status"
      aria-live="polite"
    >
      <span className="text-xs tracking-[0.08em] text-[#fff8d8]">
        Select {count === 1 ? 'a' : count} {targetType}rune{count === 1 ? '' : 's'} on {boardLabel} to destroy.
      </span>
    </div>
  );
}
