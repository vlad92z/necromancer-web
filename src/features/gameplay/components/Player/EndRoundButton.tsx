/**
 * EndRoundButton - triggers the solo end-round flow.
 */

import { useSoloGameStore } from '../../../../state/stores/soloGameStore';

/**
 * EndRoundButton - renders the end-round trigger for solo play.
 */
export function EndRoundButton() {
  const endRound = useSoloGameStore((state) => state.endRound);
  const isInProgress = useSoloGameStore((state) => state.status === 'in-progress');

  const baseClass = 'flex min-w-[120px] items-center justify-center rounded-[16px] border px-4 py-3 text-slate-100 font-semibold';
  const enabledClass = 'border-amber-500/40 bg-amber-600/10 hover:bg-amber-600/20';
  const disabledClass = 'cursor-not-allowed opacity-50';
  const className = `${baseClass} ${enabledClass} ${isInProgress ? 'cursor-pointer' : disabledClass}`;

  return (
    <button
      type="button"
      onClick={endRound}
      disabled={!isInProgress}
      className={className}
    >
      End Round
    </button>
  );
}
