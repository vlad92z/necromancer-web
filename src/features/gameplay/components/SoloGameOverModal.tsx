/**
 * SoloGameOverModal - displays the end-of-run summary for Solo mode
 */

import { useClickSound } from '../../../hooks/useClickSound';

export function SoloGameOverModal() {
  const playClickSound = useClickSound();
  const heading = "Defeat";
  const subline = "You have succumbed to arcane overload. Better luck next time!";
  const accentClasses = 'border-rose-300/70 from-rose-500/20';

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-automin-w-[360px] rounded-[28px] border bg-[rgba(6,4,18,0.95)] px-7 py-8 text-center text-[#f8fafc] shadow-[0_40px_90px_rgba(0,0,0,0.65)]">
      <div
        className={`mb-4 rounded-xl border ${accentClasses} bg-gradient-to-r to-purple-900/50 px-3.5 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em]`}
      >
        {heading}
      </div>
      <div className="mb-5 text-[15px] text-slate-300">{subline}</div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard label="Games Cleared" value={-1} accent="#60a5fa" />
        <StatCard label="Rune Score" value={-1} accent="#facc15" />
      </div>

      <button
        type="button"
        onClick={() => {
          playClickSound();
          // onReturnToStart?.();/TODO:
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
