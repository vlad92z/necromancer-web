/**
 * GameMetadataView - displays run metadata counters above the rune selection table
 */

import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';

interface GameMetadataViewProps {
  gameNumber: number;
  strainValue: number;
  arcaneDust?: number;
}

export function GameMetadataView({
  gameNumber,
  strainValue,
  arcaneDust,
}: GameMetadataViewProps) {
  const showArcaneDust = (arcaneDust ?? 0) > 0;

  return (
    <div className="w-full flex justify-center">
      <div className="flex w-full max-w-[900px] items-stretch justify-center gap-3">
        <div className="rounded-xl border border-sky-400/40 bg-[rgba(9,12,26,0.9)] px-4 py-3 text-left shadow-[0_14px_36px_rgba(0,0,0,0.45)] flex-1 flex items-center gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">Game</div>
          <div className="text-lg font-extrabold text-white leading-tight">{gameNumber}</div>
        </div>

        <div className="rounded-xl border border-amber-400/45 bg-[rgba(24,15,9,0.92)] px-4 py-3 shadow-[0_14px_36px_rgba(0,0,0,0.45)] flex-1 flex items-center gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">Overload</div>
          <div className="text-lg font-extrabold text-amber-200 leading-tight">{strainValue}</div>
        </div>

        {showArcaneDust && (
          <div className="rounded-xl border border-sky-400/40 bg-[rgba(9,12,26,0.9)] px-4 py-3 flex-1 flex items-center gap-3 shadow-[0_14px_36px_rgba(0,0,0,0.45)]">
            <img
              src={arcaneDustIcon}
              alt="Arcane Dust"
              className="h-6 w-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
            />
            <div className="text-lg font-extrabold text-amber-200">{arcaneDust?.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
