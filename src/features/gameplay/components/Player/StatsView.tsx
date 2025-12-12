/**
 * StatsView - arranges player stats in the player board header
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StatBadge } from '../../../../components/StatBadge';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import { ProgressStatOverlay } from '../ProgressStatOverlay';
import { useHealthChangeSound } from '../../../../hooks/useHealthChangeSound';
import { useCastSound } from '../../../../hooks/useCastSound';
import { buildTextTooltipCard } from '../../../../utils/tooltipCards';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';

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
  const [forcedHealSignal, setForcedHealSignal] = useState<number | null>(null);
  useHealthChangeSound(clampedHealth, forcedHealSignal);
  const playCastSound = useCastSound();
  const previousRuneScoreRef = useRef<number>(runeScore.currentScore);
  useEffect(() => {
    const previousRuneScore = previousRuneScoreRef.current;
    if (runeScore.currentScore > previousRuneScore) {
      playCastSound();
    }
    previousRuneScoreRef.current = runeScore.currentScore;
  }, [playCastSound, runeScore.currentScore]);
  const scoringSequence = useGameplayStore((state) => state.scoringSequence);
  const [forcedHealthIndicator, setForcedHealthIndicator] = useState<{ amount: number; key: number } | null>(null);
  const lastHealingStepRef = useRef<string | null>(null);
  const previousHealthRef = useRef<number>(clampedHealth);
  const forcedHealthIndicatorPayload = useMemo(
    () => (forcedHealthIndicator ? { ...forcedHealthIndicator, type: 'gain' as const } : null),
    [forcedHealthIndicator]
  );

  useEffect(() => {
    if (!scoringSequence) {
      lastHealingStepRef.current = null;
    }
  }, [scoringSequence]);

  useEffect(() => {
    const sequence = scoringSequence;
    const previousHealth = previousHealthRef.current;

    if (!sequence || sequence.activeIndex < 0) {
      previousHealthRef.current = clampedHealth;
      return;
    }

    const step = sequence.steps[sequence.activeIndex];
    const stepKey = `${sequence.sequenceId}:${sequence.activeIndex}`;

    if (!step || step.healingDelta <= 0 || lastHealingStepRef.current === stepKey) {
      previousHealthRef.current = clampedHealth;
      return;
    }

    lastHealingStepRef.current = stepKey;

    const healingChangedHealth = clampedHealth !== previousHealth;
    if (!healingChangedHealth) {
      const indicatorKey = Date.now();
      setForcedHealSignal(indicatorKey);
      setForcedHealthIndicator({ amount: step.healingDelta, key: indicatorKey });
    }

    previousHealthRef.current = clampedHealth;
  }, [clampedHealth, scoringSequence]);

  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const deckTooltip = `Runes left in deck: ${deckRemaining}`;
  const overloadTooltip = `Overloaded runes: ${overloadedRuneCount}\n Each overload deals ${strainValue} damage.`;

  const handleDeckTooltipToggle = (visible: boolean) => {
    if (visible) {
      setTooltipCards(buildTextTooltipCard('deck-tooltip', 'Deck', deckTooltip, deckSvg));
    } else {
      resetTooltipCards();
    }
  };

  const handleOverloadTooltipToggle = (visible: boolean) => {
    if (visible) {
      setTooltipCards(
        buildTextTooltipCard('overload-tooltip', 'Overload', overloadTooltip, overloadSvg)
      );
    } else {
      resetTooltipCards();
    }
  };

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
          tooltip={deckTooltip}
          image={deckSvg}
          onClick={onDeckClick}
          onTooltipToggle={handleDeckTooltipToggle}
        />
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
              tooltip={overloadTooltip}
              image={overloadSvg}
              onClick={onStrainClick}
              canOverload={canOverload}
              onTooltipToggle={handleOverloadTooltipToggle}
            />
          </div>
        </div>
        <ProgressStatOverlay
          label="Health"
          current={clampedHealth}
          max={maxHealth}
          forcedDeltaIndicator={forcedHealthIndicatorPayload}
          containerBorderColor="border-red-500/30 shadow-[0_12px_28px_rgba(0,0,0,0.42)]"
          progressBackground="bg-[rgba(248,113,113,0.16)]"
          barClassName="bg-gradient-to-r from-red-500 to-red-700 shadow-[0_10px_24px_rgba(239,68,68,0.25)]"
          valueColor="text-red-500"
          deltaGainClassName="text-emerald-300 text-sm font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]"
          deltaLossClassName="text-rose-300 text-sm font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.55)]"
        />
      </div>
    </div>
  );
}
