/**
 * SoloStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';
import { SpellpowerExplanation } from './SpellpowerExplanation';
import { StatBadge } from '../../../../components/StatBadge';
import healthSvg from '../../../../assets/stats/health.svg';
import healingSvg from '../../../../assets/stats/healing.svg';
import essenceSvg from '../../../../assets/stats/essence.svg';
import focusSvg from '../../../../assets/stats/focus.svg';
import spellpowerSvg from '../../../../assets/stats/spellpower.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import fatigueSvg from '../../../../assets/stats/fatigue.svg';
import stressSvg from '../../../../assets/stats/stress.svg';
import deckSvg from '../../../../assets/stats/deck.svg';

interface SpellpowerProps {
  isActive: boolean;
  health: number;
  healing: number;
  essence: number;
  focus: number;
  totalPower: number;
  essenceRuneCount: number;
  hasOverload: boolean;
  hasWindMitigation: boolean;
  windRuneCount: number;
  overloadPenalty: number;
  overloadMultiplier: number;
  overloadDamagePreview: number;
  round: number;
  frostRuneCount: number;
  deckCount?: number;
}

interface AnimatedHealthValueProps {
  target: number;
}

function AnimatedHealthValue({ target }: AnimatedHealthValueProps) {
  const [displayValue, setDisplayValue] = useState(target);
  const previousValue = useRef(target);

  useEffect(() => {
    const fromValue = previousValue.current;
    if (fromValue === target) {
      return;
    }

    previousValue.current = target;
    const duration = Math.min(0.85, Math.max(0.3, Math.abs(target - fromValue) * 0.05));

    const controls = animate(fromValue, target, {
      duration,
      ease: 'easeOut',
      onUpdate(latest) {
        setDisplayValue(Math.round(latest));
      },
      onComplete() {
        setDisplayValue(target);
      },
    });

    return () => controls.stop();
  }, [target]);

  return <>{displayValue}</>;
}

interface AnimatedHealingValueProps {
  baseValue: number;
  consumed: number;
  round: number;
}

function AnimatedHealingValue({ baseValue, consumed, round }: AnimatedHealingValueProps) {
  const [displayValue, setDisplayValue] = useState(baseValue);
  const animationControls = useRef<ReturnType<typeof animate> | null>(null);
  const displayValueRef = useRef(baseValue);

  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    animationControls.current?.stop();
    setDisplayValue(baseValue);
  }, [round, baseValue]);

  useEffect(() => {
    if (consumed <= 0) {
      return;
    }

    const targetValue = Math.max(0, Math.round(baseValue - consumed));
    const duration = Math.min(0.85, Math.max(0.3, consumed * 0.05));

    animationControls.current?.stop();
    const controls = animate(displayValueRef.current, targetValue, {
      duration,
      ease: 'easeOut',
      onUpdate(latest) {
        setDisplayValue(Math.round(latest));
      },
      onComplete() {
        setDisplayValue(targetValue);
      },
    });

    animationControls.current = controls;
    return () => controls.stop();
  }, [consumed, baseValue]);

  return <>{displayValue}</>;
}


export function SoloStats({
  isActive,
  health,
  healing,
  essence,
  focus,
  totalPower,
  essenceRuneCount,
  hasOverload,
  overloadPenalty,
  overloadMultiplier,
  overloadDamagePreview,
  round,
  deckCount,
}: SpellpowerProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const spellpower = totalPower;

  const focusTooltip = 'Focus - connect more runes to increase your multiplier.';

  const essenceTooltip = essenceRuneCount > 0
    ? `Essence - cast more runes to increase spell damage. Fire, Lightning, and Void runes (${essenceRuneCount}) amplify your Essence.`
    : 'Essence - cast more runes to increase spell damage.';

  const spellpowerTooltip = `Spellpower\nEssence (${essence}) × Focus (${focus}) = ${spellpower}. Increase spellpower to deal more damage.`;
  const healthTooltip = 'Health - drop to zero and your game ends.';
  const healingTooltip = `Healing (${healing}) - Life, Wind, and Frost runes heal you every round.`
  const overloadTooltip = `Overload (${overloadPenalty}) - overloaded runes increase Stress damage every round`;
  const strainTooltip = `Fatigue (${overloadMultiplier}) - accumulates as the game progresses.`;
  const damageTooltip = `Stress - damage taken every round. Stress (${overloadDamagePreview}) = Overload (${overloadPenalty}) × Fatigue (${overloadMultiplier})`;

  const openExplanation = () => setShowExplanation(true);
  const closeExplanation = () => setShowExplanation(false);

  const clickableStatCommon = { onClick: openExplanation };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.9em',
          minWidth: '8em',
          width: '100%',
          height: '100%',
          padding: '1.25em 1em',
          borderRadius: '28px',
          border: isActive ? '1px solid rgba(168, 85, 247, 0.65)' : '1px solid rgba(255, 255, 255, 0.08)',
          background: isActive
            ? 'linear-gradient(180deg, rgba(76, 29, 149, 0.55) 0%, rgba(17, 24, 39, 0.85) 100%)'
            : 'rgba(5, 8, 20, 0.85)',
          boxShadow: isActive
            ? '0 25px 55px rgba(147, 51, 234, 0.35)'
            : '0 18px 35px rgba(2, 0, 12, 0.7)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: '2em', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '0.35em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <StatBadge
              label="Health"
              value={<AnimatedHealthValue target={health} />}
              color="#fb7185"
              borderColor="rgba(248, 113, 113, 0.4)"
              tooltip={healthTooltip}
              image={healthSvg}
            />
            <StatBadge
              label="Healing"
              value={<AnimatedHealingValue baseValue={healing} consumed={0} round={round} />}
              color="#4ade80"
              borderColor="rgba(74, 222, 128, 0.4)"
              tooltip={healingTooltip}
              image={healingSvg}
            />
            <StatBadge
              label="Damage"
              value={overloadDamagePreview}
              color="#f97316"
              borderColor="rgba(249, 115, 22, 0.4)"
              tooltip={damageTooltip}
              alert={overloadDamagePreview > 0}
              image={stressSvg}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <StatBadge
              label="Overload"
              value={overloadPenalty}
              color="#fb7185"
              borderColor="rgba(248, 113, 113, 0.45)"
              tooltip={overloadTooltip}
              image={overloadSvg}
              alert={hasOverload}
            />
            <StatBadge
              label="Stress"
              value={overloadMultiplier}
              color="#38bdf8"
              borderColor="rgba(56, 189, 248, 0.35)"
              tooltip={strainTooltip}
              image={fatigueSvg}
            />
            
          </div>

          <div style={{ display: 'flex', gap: '0.35em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <StatBadge
              label="Deck"
              value={deckCount ?? 0}
              color="#60a5fa"
              borderColor="rgba(96, 165, 250, 0.35)"
              tooltip={`Runes left in deck: ${deckCount ?? 0}`}
              image={deckSvg}
            />
          </div>
        </div>
      </div>
      {showExplanation && <SpellpowerExplanation onClose={closeExplanation} />}
    </>
  );
}
