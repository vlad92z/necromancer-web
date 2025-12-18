/**
 * GameMetadataView - primary header row for counters, actions, and progress.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import arcaneDustIcon from '../../../../assets/stats/arcane_dust.png';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import { ClickSoundButton } from '../../../../components/ClickSoundButton';
import { StatBadge } from '../../../../components/StatBadge';
import { RuneScoreView } from '../RuneScoreView';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { useHealthChangeSound } from '../../../../hooks/useHealthChangeSound';
import { useCastSound } from '../../../../hooks/useCastSound';
import { buildTextTooltipCard, buildOverloadPlacementTooltipCards } from '../../../../utils/tooltipCards';
import type { Rune } from '../../../../types/game';
import type { Transition } from 'framer-motion';
import { HealthView } from '../HealthView';
import { OverloadButton } from '../Player/OverloadButton';

interface GameMetadataViewProps {
  playerId: string;
  gameIndex: number;
  strainValue: number;
  arcaneDust: number;
  runeScore: {
    currentScore: number;
    targetScore: number;
  };
  health: number;
  armor: number;
  maxHealth: number;
  deckCount: number;
  overloadedRuneCount: number;
  canOverload: boolean;
  onOpenOverload: () => void;
  onOpenDeck: () => void;
  onOpenSettings: () => void;
  onPlaceRunesInFloor: () => void;
  hasSelectedRunes: boolean;
  selectedRunes: Rune[];
  isSettingsActive: boolean;
  isOverloadActive: boolean;
  isDeckActive: boolean;
}

type ForcedArmorIndicator = {
  amount: number;
  key: number;
};


export function GameMetadataView({
  gameIndex,
  strainValue,
  arcaneDust,
  runeScore,
  health,
  maxHealth,
  deckCount,
  overloadedRuneCount,
  onOpenOverload,
  onOpenDeck,
  onOpenSettings,
  hasSelectedRunes,
  selectedRunes,
  isSettingsActive,
  isOverloadActive,
  isDeckActive,
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
  const lastHealingStepRef = useRef<string | null>(null);
  const [forcedArmorIndicator, setForcedArmorIndicator] = useState<ForcedArmorIndicator | null>(null);
  const lastArmorStepRef = useRef<string | null>(null);
  const previousHealthRef = useRef<number>(clampedHealth);
  useEffect(() => {
    if (!scoringSequence) {
      lastHealingStepRef.current = null;
    }
  }, [scoringSequence]);

  useEffect(() => {
    if (!forcedArmorIndicator) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setForcedArmorIndicator(null);
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [forcedArmorIndicator]);

  useEffect(() => {
    if (!scoringSequence) {
      lastArmorStepRef.current = null;
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
    }

    previousHealthRef.current = clampedHealth;
  }, [clampedHealth, scoringSequence]);

  useEffect(() => {
    const sequence = scoringSequence;

    if (!sequence || sequence.activeIndex < 0) {
      return;
    }

    const step = sequence.steps[sequence.activeIndex];
    const stepKey = `${sequence.sequenceId}:${sequence.activeIndex}`;

    if (!step || step.armorDelta <= 0 || lastArmorStepRef.current === stepKey) {
      return;
    }

    lastArmorStepRef.current = stepKey;
    const indicatorKey = Date.now();
    setForcedArmorIndicator({ amount: step.armorDelta, key: indicatorKey });
  }, [scoringSequence]);

  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const deckValue = Math.max(0, deckCount);
  const deckRemaining = Math.max(0, deckValue - 20);
  const deckTooltip = `You have ${deckRemaining} runes remaining.`;
  const overloadTooltip = `Overload deals ${strainValue} damage per rune. ${overloadedRuneCount} runes are currently overloaded.`;
  const handleDeckTooltipToggle = (visible: boolean) => {
    if (visible) {
      setTooltipCards(buildTextTooltipCard('deck-tooltip', 'Deck', deckTooltip, deckSvg));
    } else {
      resetTooltipCards();
    }
  };

  const handleOverloadTooltipToggle = (visible: boolean) => {
    if (!visible) {
      resetTooltipCards();
      return;
    }

    if (hasSelectedRunes) {
      setTooltipCards(buildOverloadPlacementTooltipCards(selectedRunes, strainValue), true);
      return;
    }

    setTooltipCards(buildTextTooltipCard('overload-tooltip', 'Overload', overloadTooltip, overloadSvg));
  };

  const handleDeckClick = useCallback(() => {
    onOpenDeck();
  }, [onOpenDeck]);

  const settingsHover = 'hover:border-slate-300 hover:text-white hover:bg-slate-800';
  const settingsFocus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300';
  const settingsActive = 'data-[active=true]:shadow-[0_0_28px_rgba(125,211,252,0.95),_0_0_56px_rgba(125,211,252,0.55)] data-[active=true]:bg-slate-800/80';
  const actionButtonBase = `pt-0 pr-2 pb-2 pl-4 items-center justify-center text-slate-200 rounded-2xl border border-slate-600/70 bg-slate-900 text-5xl tracking-[0.18em] text-slate-100 ${settingsHover} ${settingsFocus} ${settingsActive}`;

  const statBaseClass = 'flex min-w-[110px] items-center rounded-[16px] px-3.5 py-3 text-slate-100 border cursor-pointer';
  const deckActiveClass = 'data-[active=true]:shadow-[0_0_28px_rgba(125,211,252,0.95),_0_0_56px_rgba(125,211,252,0.55)] data-[active=true]:bg-slate-900/70';
  const deckClassName = `${statBaseClass} border-sky-500/40 bg-sky-600/10 hover:bg-sky-600/20 data-[active=true]:border-sky-300 ${deckActiveClass}`;


  return (
    <div className="flex flex-row w-full border-b border-slate-600/70 pb-2 bg-slate-900/80 px-5 pt-3">
      {/* Left side: Game Title, Arcane Dust Counter, Settings Button */}
      <div className="w-full flex flex-row flex-[29] items-center">
        <ClickSoundButton
          title="⚙"
          action={onOpenSettings}
          isActive={isSettingsActive}
          className={actionButtonBase}
        />

        <div className="flex flex-row gap-2 px-3 flex-1 justify-center items-center">
          <span className="text-lg font-semibold uppercase tracking-[0.28em] text-sky-200">Game</span>
          <span className="text-xl font-extrabold text-slate-200 leading-tight">{gameIndex + 1}</span>
        </div>

        <div className="px-4 py-3 flex items-center gap-3 pr-20">
          <img
            src={arcaneDustIcon}
            alt="Arcane Dust"
            className="h-10 w-10 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]"
          />
          <span className="text-xl font-extrabold text-amber-200">{arcaneDust.toLocaleString()}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-row flex-[60] items-center gap-3">
        <OverloadButton
          isActive={isOverloadActive}
          showOverloadView={onOpenOverload}
        />
        <StatBadge
          value={deckRemaining}
          className={deckClassName}
          image={deckSvg}
          onClick={handleDeckClick}
          onTooltipToggle={handleDeckTooltipToggle}
          isActive={isDeckActive}
        />
        <HealthView/>
        <RuneScoreView/>
      </div>
    </div>
  );
}
