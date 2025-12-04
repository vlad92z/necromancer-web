/**
 * SoloHealthTracker - displays the player's health with a red progress indicator for solo runs
 */
interface SoloHealthTrackerProps {
  health: number;
  maxHealth?: number;
}

export function SoloHealthTracker({ health, maxHealth }: SoloHealthTrackerProps) {
  const healthCap = Math.max(1, maxHealth ?? health);
  const clampedHealth = Math.max(0, Math.min(health, healthCap));
  const progressPercent = Math.round((clampedHealth / healthCap) * 100);

  return (
    <div className="flex flex-col gap-2 py-3 px-3.5 rounded-[14px] border border-red-500/30 shadow-[0_12px_28px_rgba(0,0,0,0.42)]">
      <div className="flex items-center justify-between gap-2">
        <div className="text-slate-300 text-xs tracking-[0.08em] uppercase font-extrabold">Health</div>
        <div className="text-red-500 font-extrabold text-lg min-w-[32px] text-right">{clampedHealth}</div>
      </div>
      <div className="h-[10px] rounded-full overflow-hidden relative shadow-inner bg-[rgba(248,113,113,0.16)]">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 to-red-700 shadow-[0_10px_24px_rgba(239,68,68,0.25)] transition-[width] duration-150 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
