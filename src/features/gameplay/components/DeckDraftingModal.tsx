/**
 * DeckDraftingModal - post-victory drafting overlay for Solo mode
 */

import { Runeforge } from './Center/Runeforge';
import type { DeckDraftState } from '../../../types/game';
import { useClickSound } from '../../../hooks/useClickSound';

interface DeckDraftingModalProps {
  draftState: DeckDraftState;
  onSelectRuneforge: (runeforgeId: string) => void;
  onOpenDeckOverlay: () => void;
  currentTarget: number;
  nextTarget: number;
  currentDeckSize: number;
}

export function DeckDraftingModal({
  draftState,
  onSelectRuneforge,
  onOpenDeckOverlay,
  currentTarget,
  nextTarget,
  currentDeckSize,
}: DeckDraftingModalProps) {
  const playClickSound = useClickSound();
  const picksUsed = draftState.totalPicks - draftState.picksRemaining;

  const handleSelect = (runeforgeId: string) => {
    playClickSound();
    onSelectRuneforge(runeforgeId);
  };

  const handleOpenDeckOverlay = () => {
    playClickSound();
    onOpenDeckOverlay();
  };

  return (
    <div className="w-full max-w-5xl rounded-3xl border border-white/12 bg-[rgba(10,10,24,0.9)] p-6 md:p-8 shadow-[0_34px_80px_rgba(0,0,0,0.7)] backdrop-blur">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-300/80">Deck Drafting</div>
          <h2 className="text-2xl font-bold text-white">Choose your new runes</h2>
          <p className="text-sm text-slate-300">Select one runeforge below. All four runes will be added to your deck.</p>
        </div>
        <div className="rounded-2xl border border-sky-400/40 bg-sky-900/30 px-4 py-3 text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/80">Progress</div>
          <div className="text-lg font-extrabold text-white">{picksUsed} / {draftState.totalPicks}</div>
          <div className="text-xs text-slate-200/80">Selections completed</div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
        <div
          className="h-full bg-gradient-to-r from-sky-400 to-purple-500 transition-all duration-300"
          style={{
            width: `${Math.min(100, (picksUsed / draftState.totalPicks) * 100)}%`,
          }}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {draftState.runeforges.map((runeforge) => (
          <div
            key={runeforge.id}
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
          >
            <Runeforge runeforge={runeforge} onRuneforgeSelect={handleSelect} />
            <button
              type="button"
              onClick={() => handleSelect(runeforge.id)}
              className="w-full rounded-xl border border-sky-400/40 bg-gradient-to-r from-sky-500/80 to-indigo-500/80 px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              Draft Forge
            </button>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">Selections Left</div>
          <div className="text-base font-bold text-white">{draftState.picksRemaining}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">Target Increase</div>
          <div className="text-base font-bold text-sky-200">{currentTarget} → {nextTarget} rune power</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300/80">Deck Size</div>
          <div className="text-base font-bold text-white">{currentDeckSize} runes</div>
        </div>
        <div className="flex w-full justify-end sm:w-auto">
          <button
            type="button"
            onClick={handleOpenDeckOverlay}
            className="w-full sm:w-auto rounded-xl border border-sky-400/40 bg-sky-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-50 transition hover:border-sky-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            View Deck
          </button>
        </div>
      </div>
    </div>
  );
}
