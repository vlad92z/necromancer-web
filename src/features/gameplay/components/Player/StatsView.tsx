/**
 * StatsView - arranges player stats in a three-column header for the board
 */

import { StatBadge } from '../../../../components/StatBadge';
import { SoloRuneScoreOverlay } from '../SoloRuneScoreOverlay';
import { SoloHealthTracker } from '../SoloHealthTracker';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';

interface StatsViewProps {
  playerId: string;
  deckRemaining: number;
  strainValue: number;
  canOverload: boolean;
  onDeckClick?: () => void;
  onStrainClick?: () => void;
  runeScore: {
    currentScore: number;
    targetScore: number;
  };
  health: number;
  maxHealth: number;
  onOpenSettings?: () => void;
  gameNumber: number;
  arcaneDust?: number;
}

export function StatsView({
  playerId,
  deckRemaining,
  strainValue,
  canOverload,
  onDeckClick,
  onStrainClick,
  runeScore,
  health,
  maxHealth,
  onOpenSettings,
  gameNumber,
  arcaneDust,
}: StatsViewProps) {
  return (
    <div
      className="grid gap-[min(1.2vmin,12px)] items-stretch w-full"
      style={{ gridTemplateColumns: 'auto 1fr auto' }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col gap-[min(0.8vmin,10px)] h-full">
        <StatBadge
          label="Deck"
          value={deckRemaining}
          color="#60a5fa"
          borderColor="rgba(96, 165, 250, 0.35)"
          tooltip={`Runes left in deck: ${deckRemaining}`}
          image={deckSvg}
          onClick={onDeckClick}
        />
        <div data-strain-column>
          <div
            className="inline-flex"
            data-player-id={playerId}
            data-strain-counter="true"
          >
            <StatBadge
              label="Strain"
              value={strainValue}
              color="#fa6060ff"
              borderColor="rgba(96, 165, 250, 0.35)"
              tooltip={`Overloading runes immediately deals ${strainValue} damage`}
              image={overloadSvg}
              onClick={onStrainClick}
              canOverload={canOverload}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[min(0.8vmin,10px)] h-full">
        <SoloRuneScoreOverlay
          currentScore={runeScore.currentScore}
          targetScore={runeScore.targetScore}
        />
        <SoloHealthTracker health={health} maxHealth={maxHealth} />
      </div>

      <div className="flex flex-col gap-[min(0.8vmin,10px)] h-full">
        <button
          type="button"
          onClick={onOpenSettings}
          className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        >
          ⚙ Settings
        </button>
        <div className="rounded-xl border border-sky-400/40 bg-[rgba(9,12,26,0.9)] px-4 py-3 text-left shadow-[0_14px_36px_rgba(0,0,0,0.45)] flex-1 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">Game</div>
            <div className="text-sm font-extrabold text-white leading-tight">{gameNumber}</div>
          </div>
          {arcaneDust && arcaneDust > 0 && (
            <div className="flex items-center gap-3">
              <img
                src={arcaneDustIcon}
                alt="Arcane Dust"
                className="h-6 w-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
              />
              <div className="text-sm font-extrabold text-amber-200">{arcaneDust.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
