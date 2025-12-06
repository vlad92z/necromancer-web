/**
 * SoloGameOverModal - displays the end-of-run summary for Solo mode
 */

import type { SoloOutcome } from '../../../types/game';
import { useClickSound } from '../../../hooks/useClickSound';

interface SoloGameOverModalProps {
  outcome: SoloOutcome;
  runePowerTotal: number;
  game: number;
  targetScore?: number;
  onReturnToStart?: () => void;
}

export function SoloGameOverModal({ outcome, runePowerTotal, game, targetScore, onReturnToStart }: SoloGameOverModalProps) {
  const playClickSound = useClickSound();
  const heading = outcome === 'victory' ? 'Solo Victory' : outcome === 'defeat' ? 'Defeat' : 'Run Complete';
  const missedTarget = typeof targetScore === 'number' ? runePowerTotal < targetScore : false;
  const subline = outcome === 'victory'
      ? 'No runes remain to continue the run'
      : outcome === 'defeat'
        ? missedTarget
          ? 'Arcane Overload has claimed another victim'
          : 'Your channel collapsed under overload'
        : 'The arena falls silent';
  const accentClasses =
    outcome === 'victory'
      ? 'border-emerald-300/70 from-emerald-500/20'
      : outcome === 'defeat'
      ? 'border-rose-300/70 from-rose-500/20'
      : 'border-amber-300/70 from-amber-300/25';

  return (
    <div className="min-w-[360px] rounded-[28px] border bg-[rgba(6,4,18,0.95)] px-7 py-8 text-center text-[#f8fafc] shadow-[0_40px_90px_rgba(0,0,0,0.65)]">
      <div
        className={`mb-4 rounded-xl border ${accentClasses} bg-gradient-to-r to-purple-900/50 px-3.5 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em]`}
      >
        {heading}
      </div>
      <div className="mb-5 text-[15px] text-slate-300">{subline}</div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Games Cleared" value={game} accent="#60a5fa" />
        <StatCard label="Rune Power" value={targetScore ? `${runePowerTotal} / ${targetScore}` : runePowerTotal} accent="#facc15" />
      </div>

      <button
        type="button"
        onClick={() => {
          playClickSound();
          onReturnToStart?.();
        }}
        className="w-full rounded-xl border border-white/20 bg-gradient-to-r from-cyan-200/20 to-sky-300/20 px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-slate-100 shadow-[0_16px_36px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
      >
        Back to Menu
      </button>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  accent: string;
}

function StatCard({ label, value, accent }: StatCardProps) {
  const accentClass =
    accent === '#34d399'
      ? 'text-emerald-400'
      : accent === '#60a5fa'
      ? 'text-sky-400'
      : accent === '#facc15'
      ? 'text-amber-300'
      : 'text-indigo-200';

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-200/80">
        {label}
      </div>
      <div className={`text-xl font-extrabold ${accentClass}`}>{value}</div>
    </div>
  );
}
