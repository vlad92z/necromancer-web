/**
 * VolumeControl - music and sound volume overlay control
 */
import type { ChangeEvent, ReactElement } from 'react';

interface VolumeControlProps {
  soundVolume: number; // 0..1
  isMusicMuted: boolean;
  onToggleMusic: () => void;
  onVolumeChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function VolumeControl({ soundVolume, isMusicMuted, onToggleMusic, onVolumeChange }: VolumeControlProps): ReactElement {
  return (
    <div
      className="pointer-events-auto flex items-center gap-3 rounded-full border border-slate-400/40 bg-[rgba(12,10,24,0.75)] px-3 py-2 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur"
    >
      <div className="flex min-w-[200px] flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-indigo-100">Volume</span>
          <span className="text-[12px] font-bold text-slate-200">{Math.round(soundVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(soundVolume * 100)}
          onChange={onVolumeChange}
          aria-label="Sound volume"
          className="w-full cursor-pointer accent-purple-600"
        />
      </div>
      <button
        type="button"
        onClick={onToggleMusic}
        aria-pressed={isMusicMuted}
        className={`pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-400/40 px-4 py-2 text-[13px] font-bold uppercase tracking-[0.08em] text-slate-100 shadow-[0_14px_36px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,0,0,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 ${
          isMusicMuted
            ? 'bg-gradient-to-r from-rose-400/30 to-rose-900/60'
            : 'bg-gradient-to-r from-sky-500/30 to-purple-700/50'
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.35)] ${
            isMusicMuted ? 'bg-rose-400' : 'bg-emerald-400'
          }`}
          aria-hidden={true}
        />
        {isMusicMuted ? 'Music Muted' : 'Music On'}
      </button>
    </div>
  );
}
