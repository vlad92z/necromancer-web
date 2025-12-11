/**
 * StatsView - arranges player stats in a three-column header for the board
 */

import { StatBadge } from '../../../../components/StatBadge';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import { ProgressStatOverlay } from '../ProgressStatOverlay';
import { useHealthChangeSound } from '../../../../hooks/useHealthChangeSound';

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
  const clampedHealth = Math.max(0, Math.min(health, maxHealth));
  useHealthChangeSound(clampedHealth);
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
        <ProgressStatOverlay
          label="Rune Score"
          current={runeScore.currentScore}  
          max={runeScore.targetScore}
          displayMax={runeScore.targetScore}
          deltaMode="gain-only"
          showFraction
          containerClassName="gap-3 py-[14px] px-[18px] rounded-[16px] border border-slate-400/35 bg-[linear-gradient(145deg,rgba(16,11,32,0.92)_0%,rgba(6,10,24,0.88)_100%)] shadow-[0_14px_36px_rgba(0,0,0,0.38)] backdrop-blur-[10px] max-w-[640px] w-full"
          trackClassName="h-[8px] bg-[rgba(148,163,184,0.18)]"
          barClassName="bg-gradient-to-r from-purple-500 to-sky-400 shadow-[0_8px_18px_rgba(129,140,248,0.35)]"
          reachedBarClassName="bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_8px_18px_rgba(52,211,153,0.35)]"
          valueClassName="text-yellow-400 font-extrabold text-base text-right"
          valueReachedClassName="text-emerald-400 font-extrabold text-base text-right"
          deltaGainClassName="text-sky-200 text-sm font-bold drop-shadow-[0_0_8px_rgba(125,211,252,0.55)]"
        />
        <ProgressStatOverlay
              label="Health"
              current={clampedHealth}
              max={Math.max(1, maxHealth ?? health)}
              clampToMax
              deltaMode="signed"
              containerClassName="gap-2 py-3 px-3.5 rounded-[14px] border border-red-500/30 shadow-[0_12px_28px_rgba(0,0,0,0.42)]"
              trackClassName="h-[10px] shadow-inner bg-[rgba(248,113,113,0.16)]"
              barClassName="bg-gradient-to-r from-red-500 to-red-700 shadow-[0_10px_24px_rgba(239,68,68,0.25)]"
              valueClassName="text-red-500 font-extrabold text-lg min-w-[32px] text-right"
              deltaGainClassName="text-emerald-300 text-sm font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]"
              deltaLossClassName="text-rose-300 text-sm font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.55)]"
            />
      </div>

      <div className="flex flex-col gap-[min(0.8vmin,10px)] h-full">
        <ClickSoundButton
          title="⚙ Settings"
          action={() => {
            if (onOpenSettings) {
              onOpenSettings();
            }
          }}
          className="rounded-lg border border-slate-600/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        />
        <div className="rounded-xl border border-sky-400/40 bg-[rgba(9,12,26,0.9)] px-4 py-3 text-left shadow-[0_14px_36px_rgba(0,0,0,0.45)] flex-1 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">Game</div>
            <div className="text-sm font-extrabold text-white leading-tight">{gameNumber}</div>
          </div>
          
        </div>
        {arcaneDust && arcaneDust > 0 && (
            <div className="rounded-xl border border-sky-400/40 bg-[rgba(9,12,26,0.9)] px-4 py-3 flex items-center gap-3">
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
  );
}
