/**
 * PlayerStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { animate } from 'framer-motion';
import { SpellpowerExplanation } from './SpellpowerExplanation';

type StatIconType = 'health' | 'healing' | 'essence' | 'focus' | 'spellpower';

interface SpellpowerProps {
  playerName: string;
  isActive: boolean;
  nameColor: string;
  health: number;
  healing: number;
  essence: number;
  focus: number;
  totalPower: number;
  fireRuneCount: number;
  hasPenalty: boolean;
  hasWindMitigation: boolean;
  windRuneCount: number;
  round: number;
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
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 19s-7-4.35-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.65-7 9-7 9Z"
          fill={color}
          opacity={0.9}
        />
      </svg>
    );
  }

  if (type === 'healing') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M6.8291 17.0806C13.9002 21.3232 19.557 15.6663 18.8499 5.0598C8.24352 4.35269 2.58692 10.0097 6.8291 17.0806ZM6.8291 17.0806C6.82902 17.0805 6.82918 17.0807 6.8291 17.0806ZM6.8291 17.0806L5 18.909M6.8291 17.0806L10.6569 13.2522" {...strokeProps}> </path>
      </svg>
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
  playerName,
  isActive,
  nameColor,
  health,
  healing,
  essence,
  focus,
  totalPower,
  fireRuneCount,
  hasPenalty,
  hasWindMitigation,
  windRuneCount,
  round
}: SpellpowerProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const spellpower = totalPower ?? (essence * focus);
  const previousHealthRef = useRef(health);
  const healedAmount = Math.max(0, health - previousHealthRef.current);

  useEffect(() => {
    previousHealthRef.current = health;
  }, [health]);

  const focusColor = hasPenalty ? '#f87171' : '#38bdf8';
  const focusBorder = hasPenalty ? 'rgba(248, 113, 113, 0.55)' : 'rgba(56, 189, 248, 0.35)';
  const focusTooltip = hasPenalty
    ? 'Overload is reducing your Focus. Cast more Wind runes on your wall to mitigate it.'
    : hasWindMitigation
      ? `Wind runes (${windRuneCount}) are shielding you from Overload, keeping Focus intact.`
      : 'Focus - connect more runes to increase your multiplier.';

  const essenceTooltip = fireRuneCount > 0
    ? `Esence - cast more runes to increase spell damage. Fire runes (${fireRuneCount}) amplify your Essence.`
    : 'Esence - cast more runes to increase spell damage.';

  const spellpowerTooltip = `Spellpower\nEssence (${essence}) × Focus (${focus}) = ${spellpower}. Increase spellpower to deal more damage.`;
  const healthTooltip = 'Health - drop to zero and your duel ends.';
  const healingTooltip = healing > 0
    ? `Life runes will restore ${healing} health every round.`
    : 'Healing - cast life runes to heal yourself every round.';

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
        <div style={{ display: 'flex', gap: '0.25em', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
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
            label="Spellpower"
            value={spellpower}
            color="#c084fc"
            borderColor="rgba(192, 132, 252, 0.4)"
            tooltip={spellpowerTooltip}
            {...clickableStatCommon}
          />
        </div>
      </div>
      {showExplanation && <SpellpowerExplanation onClose={closeExplanation} />}
    </>
  );
}

