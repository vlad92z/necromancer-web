/**
 * SoloRuneScoreOverlay - displays the solo target and current rune score
 */

interface SoloRuneScoreOverlayProps {
  currentScore: number;
  targetScore: number;
}

export function SoloRuneScoreOverlay({ currentScore, targetScore }: SoloRuneScoreOverlayProps) {
  const progress = targetScore > 0 ? Math.min(1, currentScore / targetScore) : 0;
  const progressPercent = Math.round(progress * 100);
  const reachedTarget = currentScore >= targetScore;

  return (
    <div className="flex flex-col gap-3 py-[14px] px-[18px] rounded-[16px] border border-slate-400/35 bg-[linear-gradient(145deg,rgba(16,11,32,0.92)_0%,rgba(6,10,24,0.88)_100%)] shadow-[0_14px_36px_rgba(0,0,0,0.38)] backdrop-blur-[10px] max-w-[640px] w-full">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center gap-1.5">
          <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">Rune Score</div>
          <div className={`${reachedTarget ? 'text-emerald-400' : 'text-yellow-400'} font-extrabold text-base min-w-[140px] text-right`}>{currentScore} / {targetScore}</div>
        </div>
        <div className="h-[8px] rounded-full bg-[rgba(148,163,184,0.18)] overflow-hidden relative">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-[width] duration-150 ease-in-out ${
              reachedTarget ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_8px_18px_rgba(52,211,153,0.35)]' : 'bg-gradient-to-r from-purple-500 to-sky-400 shadow-[0_8px_18px_rgba(129,140,248,0.35)]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
