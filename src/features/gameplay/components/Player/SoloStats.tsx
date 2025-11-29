/**
 * PlayerStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { animate } from 'framer-motion';
import { SpellpowerExplanation } from './SpellpowerExplanation';
import healthSvg from '../../../../assets/stats/health.svg?raw';
import healingSvg from '../../../../assets/stats/healing.svg?raw';

type StatIconType =
  | 'health'
  | 'healing'
  | 'essence'
  | 'focus'
  | 'spellpower'
  | 'overload'
  | 'strain'
  | 'runePower'
  | 'damage'
  | 'voidPower'
  | 'deck'
  | 'fatigue';

interface SpellpowerProps {
  isActive: boolean;
  health: number;
  healing: number;
  essence: number;
  focus: number;
  totalPower: number;
  runePowerTotal: number;
  essenceRuneCount: number;
  hasPenalty: boolean;
  hasWindMitigation: boolean;
  windRuneCount: number;
  overloadPenalty: number;
  overloadMultiplier: number;
  overloadDamagePreview: number;
  round: number;
  frostRuneCount: number;
  voidRuneCount: number;
  fatigueMultiplier: number;
  deckCount?: number;
}

function StatIcon({ type, color }: { type: StatIconType; color: string }) {
  const size = 35;
  const strokeProps = {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  if (type === 'health') {
    const sanitizedSvg = healthSvg
      .replace(/<\\?xml.*?\\?>\\s*/u, '')
      .replace(/width="[^"]*"/u, `width="${size}"`)
      .replace(/height="[^"]*"/u, `height="${size}"`)
      .replace(/fill="[^"]*"/gu, `fill="${color}"`);

    return (
      <span
        aria-hidden
        style={{ display: 'inline-flex', width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
    );
  }

  if (type === 'healing') {
    const sanitizedSvg = healingSvg
      .replace(/<\\?xml.*?\\?>\\s*/u, '')
      .replace(/width="[^"]*"/u, `width="${size}"`)
      .replace(/height="[^"]*"/u, `height="${size}"`)
      .replace(/stroke="[^"]*"/gu, `stroke="${color}"`);

    return (
      <span
        aria-hidden
        style={{ display: 'inline-flex', width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />
    );
  }

  if (type === 'essence') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M13 2 3 14h6l-1 8 10-12h-6l1-8Z" fill={color} opacity={0.85} />
      </svg>
    );
  }

  if (type === 'focus') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7" {...strokeProps} />
        <circle cx="12" cy="12" r="2.5" fill={color} opacity={0.9} />
        <path d="M12 5v2.5" {...strokeProps} />
        <path d="M12 18.5V17" {...strokeProps} />
        <path d="M5 12h2.5" {...strokeProps} />
        <path d="M16.5 12H19" {...strokeProps} />
      </svg>
    );
  }

  if (type === 'overload') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 3 3 21h18L12 3Z" {...strokeProps} />
        <path d="M12 9v4" {...strokeProps} />
        <circle cx="12" cy="16" r="1.6" fill={color} opacity={0.92} />
      </svg>
    );
  }

  if (type === 'strain') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M4 12h16" {...strokeProps} />
        <path d="M8 8h4l-3-3" {...strokeProps} />
        <path d="M16 16h-4l3 3" {...strokeProps} />
        <path d="M9.5 12h5" {...strokeProps} />
        <circle cx="12" cy="12" r="2.5" fill={color} opacity={0.9} />
      </svg>
    );
  }

  if (type === 'spellpower' || type === 'runePower') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 3v4" {...strokeProps} />
        <path d="M12 17v4" {...strokeProps} />
        <path d="M4 12h4" {...strokeProps} />
        <path d="M16 12h4" {...strokeProps} />
        <path d="m7 7 2.5 2.5" {...strokeProps} />
        <path d="m14.5 14.5 2.5 2.5" {...strokeProps} />
        <path d="m7 17 2.5-2.5" {...strokeProps} />
        <path d="m14.5 9.5 2.5-2.5" {...strokeProps} />
        <circle cx="12" cy="12" r="2" fill={color} opacity={0.95} />
      </svg>
    );
  }

  if (type === 'damage') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M4 5h7v7H4z" {...strokeProps} />
        <path d="M13 12h7v7h-7z" {...strokeProps} />
        <path d="M21 3 3 21" {...strokeProps} />
        <circle cx="10" cy="10" r="1.8" fill={color} opacity={0.92} />
        <circle cx="14" cy="14" r="1.8" fill={color} opacity={0.92} />
      </svg>
    );
  }

  if (type === 'voidPower') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" {...strokeProps} />
        <path d="M8 12a4 4 0 0 1 8 0" {...strokeProps} />
        <path d="M12 6v2" {...strokeProps} />
        <path d="M12 16v2" {...strokeProps} />
        <circle cx="12" cy="12" r="2.2" fill={color} opacity={0.9} />
      </svg>
    );
  }

  if (type === 'deck') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" ry="2" {...strokeProps} />
        <path d="M3 9h18" {...strokeProps} />
        <circle cx="7" cy="12" r="1.6" fill={color} opacity={0.95} />
      </svg>
    );
  }

  if (type === 'fatigue') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M5 12a7 7 0 0 1 14 0" {...strokeProps} />
        <path d="M12 5v3" {...strokeProps} />
        <path d="M12 12v5" {...strokeProps} />
        <path d="M9 17h6" {...strokeProps} />
        <circle cx="12" cy="12" r="1.4" fill={color} opacity={0.92} />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="7.5" {...strokeProps} />
      <circle cx="12" cy="12" r="3" fill={color} opacity={0.9} />
    </svg>
  );
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

interface StatBadgeProps {
  type: StatIconType;
  label: string;
  value: ReactNode;
  color: string;
  borderColor: string;
  tooltip: string;
  onClick?: () => void;
  alert?: boolean;
}

function StatBadge({ type, label, value, color, borderColor, tooltip, onClick, alert }: StatBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isClickable = typeof onClick === 'function';
  const baseShadow = alert ? '0 0 16px rgba(248, 113, 113, 0.4)' : '0 10px 26px rgba(0,0,0,0.45)';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={onClick}
        style={{
          fontSize: '0.2rem',
          display: 'flex',
          alignItems: 'center',
          padding: '2em 3em',
          background: 'rgba(8, 17, 35, 0.85)',
          borderRadius: '0.6rem',
          border: `1px solid ${borderColor}`,
          cursor: isClickable ? 'pointer' : 'default',
          color: '#f8fafc',
          boxShadow: baseShadow,
          transition: 'box-shadow 0.2s ease',
        }}
        aria-label={`${label}: ${tooltip}`}
      >
        <StatIcon type={type} color={color} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, marginLeft: '0.5rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 600 }}>{value}</span>
        </div>
      </button>
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(240px, 70vw)',
            padding: '10px 14px',
            background: 'rgba(3, 7, 18, 0.95)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5f5',
            fontSize: '1rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            boxShadow: '0 20px 45px rgba(0,0,0,0.55)',
            zIndex: 5,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

export function SoloStats({
  isActive,
  health,
  healing,
  essence,
  focus,
  totalPower,
  runePowerTotal,
  essenceRuneCount,
  hasPenalty,
  hasWindMitigation,
  windRuneCount,
  overloadPenalty,
  overloadMultiplier,
  overloadDamagePreview,
  round,
  frostRuneCount,
  voidRuneCount,
  fatigueMultiplier
  , deckCount
}: SpellpowerProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const spellpower = totalPower ?? (essence * focus);
  const previousHealthRef = useRef(health);
  const healedAmount = Math.max(0, health - previousHealthRef.current);
  const voidPower = voidRuneCount;
  const displayFatigueMultiplier = Math.max(0, Math.round(fatigueMultiplier * 10) / 10);

  useEffect(() => {
    previousHealthRef.current = health;
  }, [health]);

  const focusColor = hasPenalty ? '#f87171' : '#38bdf8';
  const focusBorder = hasPenalty ? 'rgba(248, 113, 113, 0.55)' : 'rgba(56, 189, 248, 0.35)';
  const focusTooltip = hasPenalty
    ? 'Overload is building damage, but Focus stays steady. Clear the floor to avoid health loss.'
    : 'Focus - connect more runes to increase your multiplier.';

  const essenceTooltip = essenceRuneCount > 0
    ? `Essence - cast more runes to increase spell damage. Fire, Lightning, and Void runes (${essenceRuneCount}) amplify your Essence.`
    : 'Essence - cast more runes to increase spell damage.';

  const spellpowerTooltip = `Spellpower\nEssence (${essence}) × Focus (${focus}) = ${spellpower}. Increase spellpower to deal more damage.`;
  const healthTooltip = 'Health - drop to zero and your duel ends.';
  const healingTooltip = healing > 0
    ? `Healing - Life, Wind, and Frost runes on your wall will restore ${healing} health during scoring${hasWindMitigation ? ` (Wind runes: ${windRuneCount})` : ''}.`
    : 'Healing - secure Life, Wind, or Frost runes to heal yourself during scoring.';
  const overloadTooltip = overloadPenalty > 0
    ? `Overload (${overloadPenalty}) will hit your health at round end. Clear overflow to avoid damage.`
    : 'Overload - keep the floor clear to avoid end-of-round damage.';
  const strainTooltip = frostRuneCount > 0
    ? `Stress ×${overloadMultiplier}. Frost runes now add healing instead of reducing stress. Current damage preview: ${overloadDamagePreview}.`
    : `Stress ×${overloadMultiplier} scales Overload each round. Current damage preview: ${overloadDamagePreview}.`;
  const runePowerTooltip = 'Rune Power - total spellpower accumulated across the duel.';
  const damageTooltip = `Damage - projected health loss at round end: Overload (${overloadPenalty}) × Stress (${overloadMultiplier}) = ${overloadDamagePreview}.`;
  const voidPowerTooltip = voidPower > 0
    ? `Void Essence - Void runes (${voidRuneCount}) add +1 Essence each.`
    : 'Void Essence - collect Void runes to add more Essence.';
  const fatigueTooltip = `Fatigue - Stress growth for next round. Base ×${displayFatigueMultiplier}.`;

  const openExplanation = () => setShowExplanation(true);
  const closeExplanation = () => setShowExplanation(false);

  const clickableStatCommon = {
    onClick: openExplanation,
  };

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
              type="health"
              label="Health"
              value={<AnimatedHealthValue target={health} />}
              color="#fb7185"
              borderColor="rgba(248, 113, 113, 0.4)"
              tooltip={healthTooltip}
            />
            <StatBadge
              type="healing"
              label="Healing"
              value={<AnimatedHealingValue baseValue={healing} consumed={healedAmount} round={round} />}
              color="#4ade80"
              borderColor="rgba(74, 222, 128, 0.4)"
              tooltip={healingTooltip}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <StatBadge
              type="essence"
              label="Essence"
              value={essence}
              color="#facc15"
              borderColor="rgba(250, 204, 21, 0.35)"
              tooltip={essenceTooltip}
              {...clickableStatCommon}
            />
            <StatBadge
              type="focus"
              label="Focus"
              value={focus}
              color={focusColor}
              borderColor={focusBorder}
              tooltip={focusTooltip}
              alert={hasPenalty}
              {...clickableStatCommon}
            />
            <StatBadge
              type="spellpower"
              label="Spell Power"
              value={spellpower}
              color="#c084fc"
              borderColor="rgba(192, 132, 252, 0.4)"
              tooltip={spellpowerTooltip}
              {...clickableStatCommon}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <StatBadge
              type="overload"
              label="Overload"
              value={overloadPenalty}
              color="#fb7185"
              borderColor="rgba(248, 113, 113, 0.45)"
              tooltip={overloadTooltip}
              alert={overloadPenalty > 0}
            />
            <StatBadge
              type="strain"
              label="Stress"
              value={overloadMultiplier}
              color="#38bdf8"
              borderColor="rgba(56, 189, 248, 0.35)"
              tooltip={strainTooltip}
            />
            <StatBadge
              type="damage"
              label="Damage"
              value={overloadDamagePreview}
              color="#f97316"
              borderColor="rgba(249, 115, 22, 0.4)"
              tooltip={damageTooltip}
              alert={overloadDamagePreview > 0}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.35em', flexWrap: 'wrap', justifyContent: 'center' }}>
            <StatBadge
              type="deck"
              label="Deck"
              value={deckCount ?? 0}
              color="#60a5fa"
              borderColor="rgba(96, 165, 250, 0.35)"
              tooltip={`Runes left in deck: ${deckCount ?? 0}`}
            />
          </div>
        </div>
      </div>
      {showExplanation && <SpellpowerExplanation onClose={closeExplanation} />}
    </>
  );
}
