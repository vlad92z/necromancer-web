/**
 * StatsView - arranges player stats in the player board header
 */

import { StatBadge } from '../../../../components/StatBadge';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import { ProgressStatOverlay } from '../ProgressStatOverlay';
import { useHealthChangeSound } from '../../../../hooks/useHealthChangeSound';

interface StatsViewProps {
  playerId: string;
  deckRemaining: number;
  strainValue: number;
  overloadedRuneCount: number;
  canOverload: boolean;
  onDeckClick?: () => void;
  onStrainClick?: () => void;
  runeScore: {
    currentScore: number;
    targetScore: number;
  };
  health: number;
  maxHealth: number;
}

export function StatsView({
  playerId,
  deckRemaining,
  strainValue,
  overloadedRuneCount,
  canOverload,
  onDeckClick,
  onStrainClick,
  runeScore,
  health,
  maxHealth,
}: StatsViewProps) {
  const clampedHealth = Math.max(0, Math.min(health, maxHealth));
  useHealthChangeSound(clampedHealth);
  return (
    <div
      className="flex flex-col gap-[min(1.2vmin,12px)] w-full"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-row gap-[min(0.8vmin,10px)] w-full">
        <StatBadge
          label="Deck"
          value={deckRemaining}
          color="#60a5fa"
          borderColor="rgba(96, 165, 250, 0.35)"
          tooltip={`Runes left in deck: ${deckRemaining}`}
          image={deckSvg}
          onClick={onDeckClick}
        />
        <ProgressStatOverlay
          label="Health"
          current={clampedHealth}
          max={maxHealth}
          containerBorderColor="border-red-500/30 shadow-[0_12px_28px_rgba(0,0,0,0.42)]"
          progressBackground="bg-[rgba(248,113,113,0.16)]"
          barClassName="bg-gradient-to-r from-red-500 to-red-700 shadow-[0_10px_24px_rgba(239,68,68,0.25)]"
          valueColor="text-red-500"
          deltaGainClassName="text-emerald-300 text-sm font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]"
          deltaLossClassName="text-rose-300 text-sm font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.55)]"
        />
      </div>
      <div className="flex flex-row gap-[min(0.8vmin,10px)] w-full">
        <div data-strain-column>
          <div
            className="inline-flex"
            data-player-id={playerId}
            data-strain-counter="true"
          >
            <StatBadge
              label="Overloaded Runes"
              value={overloadedRuneCount}
              color="#fa6060ff"
              borderColor="rgba(96, 165, 250, 0.35)"
              tooltip={`Overloaded runes this run: ${overloadedRuneCount}. Each overload currently deals ${strainValue} damage.`}
              image={overloadSvg}
              onClick={onStrainClick}
              canOverload={canOverload}
            />
          </div>
        </div>
        <ProgressStatOverlay
          label="Rune Score"
          current={runeScore.currentScore}
          max={runeScore.targetScore}
          showFraction
          containerBorderColor="border-blue-500/35 shadow-[0_12px_28px_rgbargba(16,11,32,0.92)"
          progressBackground="bg-[rgba(128,193,255,0.18)]"
          barClassName="bg-gradient-to-r from-purple-500 to-sky-400 shadow-[0_8px_18px_rgba(129,140,248,0.35)]"
          valueColor="text-yellow-400"
          deltaGainClassName="text-sky-200 text-sm font-bold drop-shadow-[0_0_8px_rgba(125,211,252,0.55)]"
        />


      </div>
    </div>
  );
}
