/**
 * GameMetadataView - primary header row for counters, actions, and progress.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import { StatBadge } from '../../../../components/StatBadge';
import { ProgressStatOverlay } from '../ProgressStatOverlay';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { useHealthChangeSound } from '../../../../hooks/useHealthChangeSound';
import { useCastSound } from '../../../../hooks/useCastSound';
import { buildTextTooltipCard } from '../../../../utils/tooltipCards';

interface GameMetadataViewProps {
  playerId: string;
  gameNumber: number;
  strainValue: number;
  arcaneDust: number;
  runeScore: {
    currentScore: number;
    targetScore: number;
  };
  health: number;
  maxHealth: number;
  deckCount: number;
  overloadedRuneCount: number;
  canOverload: boolean;
  onOpenOverload: () => void;
  onOpenDeck: () => void;
  onOpenSettings: () => void;
  onPlaceRunesInFloor: () => void;
  hasSelectedRunes: boolean;
}

type ForcedHealthIndicator = {
  amount: number;
  key: number;
};

export function GameMetadataView({
  playerId,
  gameNumber,
  strainValue,
  arcaneDust,
  runeScore,
  health,
  maxHealth,
  deckCount,
  overloadedRuneCount,
  canOverload,
  onOpenOverload,
  onOpenDeck, 
  onOpenSettings,
  onPlaceRunesInFloor,
  hasSelectedRunes,
}: GameMetadataViewProps) {
  const clampedHealth = Math.max(0, Math.min(health, maxHealth));
  const [forcedHealSignal, setForcedHealSignal] = useState<number | null>(null);
  useHealthChangeSound(clampedHealth, forcedHealSignal);
  const playCastSound = useCastSound();
  const previousRuneScoreRef = useRef(runeScore.currentScore);
  useEffect(() => {
    const previousRuneScore = previousRuneScoreRef.current;
    if (runeScore.currentScore > previousRuneScore) {
      playCastSound();
    }
    previousRuneScoreRef.current = runeScore.currentScore;
  }, [playCastSound, runeScore.currentScore]);
  const scoringSequence = useGameplayStore((state) => state.scoringSequence);
  const [forcedHealthIndicator, setForcedHealthIndicator] = useState<ForcedHealthIndicator | null>(null);
  const lastHealingStepRef = useRef<string | null>(null);
  const previousHealthRef = useRef<number>(clampedHealth);
  const forcedHealthIndicatorPayload = useMemo(
    () => (forcedHealthIndicator ? { ...forcedHealthIndicator, type: 'gain' as const } : null),
    [forcedHealthIndicator],
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
  const deckValue = Math.max(0, deckCount);
  const deckRemaining = Math.max(0, deckValue - 20);
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
      setTooltipCards(buildTextTooltipCard('overload-tooltip', 'Overload', overloadTooltip, overloadSvg));
    } else {
      resetTooltipCards();
    }
  };

  const handleOverloadClick = useCallback(() => {
    if (hasSelectedRunes) {
      onPlaceRunesInFloor();
      return;
    }
    onOpenOverload();
  }, [hasSelectedRunes, onOpenOverload, onPlaceRunesInFloor]);

  const handleDeckClick = useCallback(() => {
    onOpenDeck();
  }, [onOpenDeck]);

  const actionButtonBase = 'rounded-lg border border-slate-600/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-slate-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300';

  return (
    <div className="flex flex-row w-full border-b border-slate-600/70 pb-2">
      {/* Left side: Game Title, Arcane Dust Counter, Settings Button */}
      <div className="flex flex-row flex-[29] items-center gap-3">
        <ClickSoundButton
          title="Settings"
          action={onOpenSettings}
          className={actionButtonBase}
        />

        <div className="flex flex-row gap-2 p-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-200">Game</span>
          <span className="text-lg font-extrabold text-white leading-tight">{gameNumber}</span>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <img
            src={arcaneDustIcon}
            alt="Arcane Dust"
            className="h-6 w-6 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
          />
          <span className="text-lg font-extrabold text-amber-200">{arcaneDust.toLocaleString()}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-row flex-[60] items-center gap-3">
        <div
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
            canOverload={canOverload}
            onClick={handleOverloadClick}
            onTooltipToggle={handleOverloadTooltipToggle}
          />
        </div>
        <StatBadge
          label="Deck"
          value={deckRemaining}
          color="#60a5fa"
          borderColor="rgba(59, 130, 246, 0.35)"
          tooltip={deckTooltip}
          image={deckSvg}
          onClick={handleDeckClick}
          onTooltipToggle={handleDeckTooltipToggle}
        />
        <ProgressStatOverlay
          label="Health"
          current={clampedHealth}
          max={maxHealth}
          forcedDeltaIndicator={forcedHealthIndicatorPayload}
          progressBackground="bg-[rgba(248,113,113,0.12)]"
          barClassName="bg-gradient-to-r from-red-500 to-red-700 shadow-[0_10px_24px_rgba(239,68,68,0.25)]"
          valueColor="text-red-500"
          deltaGainClassName="text-emerald-300 text-sm font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]"
          deltaLossClassName="text-rose-300 text-sm font-bold drop-shadow-[0_0_8px_rgba(248,113,113,0.55)]"
        />

        <ProgressStatOverlay
          label="Rune Score"
          current={runeScore.currentScore}
          max={Math.max(1, runeScore.targetScore)}
          progressBackground="bg-[rgba(128,193,255,0.18)]"
          barClassName="bg-gradient-to-r from-purple-500 to-sky-400 shadow-[0_8px_18px_rgba(129,140,248,0.35)]"
          valueColor="text-yellow-400"
          deltaGainClassName="text-sky-200 text-sm font-bold drop-shadow-[0_0_8px_rgba(125,211,252,0.55)]"
        />
      </div>
    </div>
  );
}
