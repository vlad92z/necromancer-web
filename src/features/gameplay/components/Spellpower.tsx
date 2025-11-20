/**
 * Spellpower component - displays player vitals, scoring stats, and helpful tooltips
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls, animate } from 'framer-motion';
import { useGameplayStore } from '../../../state/stores/gameplayStore';
import { SpellpowerExplanation } from './SpellpowerExplanation';

const HEAL_ANIMATION_DURATION_MS = 500;
const HEAL_TO_DAMAGE_DELAY_MS = 250;
const DAMAGE_ANIMATION_DURATION_MS = 500;
const PLAYER_SEQUENCE_PADDING_MS = 500;
const PLAYER_SEQUENCE_DURATION_MS =
  HEAL_ANIMATION_DURATION_MS + HEAL_TO_DAMAGE_DELAY_MS + DAMAGE_ANIMATION_DURATION_MS + PLAYER_SEQUENCE_PADDING_MS;
const BASE_SEQUENCE_DELAY_MS = 1200;

const HEALTH_PULSE_POSITIVE = '#4ade80';
const HEALTH_PULSE_NEGATIVE = '#fb7185';
const HEALING_PULSE_COLOR = '#4ade80';
const SPELLPOWER_PULSE_COLOR = '#c084fc';

type StatIconType = 'health' | 'healing' | 'essence' | 'focus' | 'spellpower';

interface SpellpowerProps {
  playerId: string;
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
  onShowDeck: () => void;
  onShowLog: () => void;
  onShowRules: () => void;
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

interface StatBadgeProps {
  type: StatIconType;
  label: string;
  value: number | string;
  color: string;
  borderColor: string;
  tooltip: string;
  onClick?: () => void;
  alert?: boolean;
  pulseKey?: number;
  pulseColor?: string;
}

function StatBadge({ type, label, value, color, borderColor, tooltip, onClick, alert, pulseKey = 0, pulseColor }: StatBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isClickable = typeof onClick === 'function';
  const controls = useAnimationControls();
  const baseShadow = alert ? '0 0 20px rgba(248, 113, 113, 0.5)' : '0 8px 22px rgba(0,0,0,0.45)';

  useEffect(() => {
    controls.set({ scale: 1, boxShadow: baseShadow });
  }, [controls, baseShadow]);

  useEffect(() => {
    if (!pulseKey) {
      return;
    }
    controls.start({
      scale: [1, 1.08, 1],
      boxShadow: [
        baseShadow,
        `0 0 30px ${pulseColor ?? borderColor}`,
        baseShadow
      ],
      transition: {
        duration: 0.6,
        times: [0, 0.5, 1],
        ease: 'easeOut'
      }
    });
  }, [pulseKey, controls, pulseColor, baseShadow, borderColor]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <motion.button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={onClick}
        animate={controls}
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
          transition: 'transform 0.2s ease'
        }}
        aria-label={`${label}: ${tooltip}`}
      >
        <StatIcon type={type} color={color} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 600 }}>{value}</span>
        </div>
      </motion.button>
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
            boxShadow: '0 20px 45px rgba(0,0,0,0.55)',
            zIndex: 5
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

export function Spellpower({
  playerId,
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
  windRuneCount
}: SpellpowerProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const spellpower = totalPower ?? (essence * focus);
  const [displayHealth, setDisplayHealth] = useState(health);
  const [isAnimatingHealth, setIsAnimatingHealth] = useState(false);
  const [healthPulse, setHealthPulse] = useState({ key: 0, color: HEALTH_PULSE_NEGATIVE });
  const [healingPulse, setHealingPulse] = useState({ key: 0, color: HEALING_PULSE_COLOR });
  const [spellPulse, setSpellPulse] = useState({ key: 0, color: SPELLPOWER_PULSE_COLOR });
  const roundHistory = useGameplayStore((state) => state.roundHistory);
  const players = useGameplayStore((state) => state.players);
  const playerIndex = players.findIndex((player) => player.id === playerId);
  const opponentIndex = playerIndex === 0 ? 1 : 0;
  const roundCount = roundHistory.length;
  const latestRound = roundHistory[roundCount - 1];
  const playerMaxHealth = players[playerIndex]?.maxHealth ?? players[playerIndex]?.health ?? health;
  const previousHealthRef = useRef(health);
  const previousRoundCountRef = useRef(roundCount);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const healthTweenRef = useRef<ReturnType<typeof animate> | null>(null);

  const clearScheduledAnimations = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
    if (healthTweenRef.current) {
      healthTweenRef.current.stop();
      healthTweenRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearScheduledAnimations();
    };
  }, []);

  const animateHealthValue = (from: number, to: number, durationMs: number) => {
    healthTweenRef.current?.stop();
    healthTweenRef.current = animate(from, to, {
      duration: durationMs / 1000,
      ease: 'easeInOut',
      onUpdate: (value) => setDisplayHealth(Math.round(value)),
      onComplete: () => setDisplayHealth(Math.round(to))
    });
  };

  const schedule = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      callback();
    }, delay);
    timersRef.current.push(timer);
  };

  const triggerHealthPulse = (color: string) => {
    setHealthPulse((prev) => ({ key: prev.key + 1, color }));
  };

  const triggerHealingPulse = () => {
    setHealingPulse((prev) => ({ key: prev.key + 1, color: HEALING_PULSE_COLOR }));
  };

  const triggerSpellPulse = () => {
    setSpellPulse((prev) => ({ key: prev.key + 1, color: SPELLPOWER_PULSE_COLOR }));
  };

  useEffect(() => {
    if (roundCount === 0 || playerIndex === -1) {
      previousRoundCountRef.current = roundCount;
      return;
    }

    if (roundCount <= previousRoundCountRef.current) {
      return;
    }

    previousRoundCountRef.current = roundCount;
    const previousHealth = previousHealthRef.current ?? health;

    const healPotential = Math.max(0, Math.min(healing, Math.max(0, playerMaxHealth - previousHealth)));
    const healTarget = previousHealth + healPotential;
    const incomingDamage = playerIndex === 0 ? latestRound?.opponentTotal ?? 0 : latestRound?.playerTotal ?? 0;
    const outgoingDamage = playerIndex === 0 ? latestRound?.playerTotal ?? 0 : latestRound?.opponentTotal ?? 0;
    const finalHealthTarget = health;
    const hasHealing = healPotential > 0;
    const hasDamageStage = incomingDamage > 0 || finalHealthTarget < healTarget;

    if (!hasHealing && !hasDamageStage && outgoingDamage === 0) {
      setDisplayHealth(health);
      return;
    }

    clearScheduledAnimations();
    setIsAnimatingHealth(true);
    setDisplayHealth(previousHealth);

    const baseDelay = BASE_SEQUENCE_DELAY_MS + playerIndex * PLAYER_SEQUENCE_DURATION_MS;
    const healingStart = baseDelay;
    const damageStart = baseDelay + HEAL_ANIMATION_DURATION_MS + HEAL_TO_DAMAGE_DELAY_MS;
    const sequenceEnd = damageStart + (hasDamageStage ? DAMAGE_ANIMATION_DURATION_MS : 0) + PLAYER_SEQUENCE_PADDING_MS;

    if (hasHealing) {
      schedule(() => {
        triggerHealthPulse(HEALTH_PULSE_POSITIVE);
        triggerHealingPulse();
        animateHealthValue(previousHealth, healTarget, HEAL_ANIMATION_DURATION_MS);
      }, healingStart);
    }

    if (hasDamageStage) {
      schedule(() => {
        triggerHealthPulse(HEALTH_PULSE_NEGATIVE);
        animateHealthValue(hasHealing ? healTarget : previousHealth, finalHealthTarget, DAMAGE_ANIMATION_DURATION_MS);
      }, damageStart);
    }

    schedule(() => {
      setIsAnimatingHealth(false);
      setDisplayHealth(health);
    }, sequenceEnd);

    if (outgoingDamage > 0 && opponentIndex >= 0) {
      const opponentDamageStart = BASE_SEQUENCE_DELAY_MS + opponentIndex * PLAYER_SEQUENCE_DURATION_MS + HEAL_ANIMATION_DURATION_MS + HEAL_TO_DAMAGE_DELAY_MS;
      schedule(() => {
        triggerSpellPulse();
      }, opponentDamageStart);
    }
  }, [roundCount, latestRound, playerIndex, opponentIndex, health, healing, playerMaxHealth]);

  useEffect(() => {
    previousHealthRef.current = health;
  }, [health]);

  useEffect(() => {
    if (!isAnimatingHealth) {
      setDisplayHealth(health);
    }
  }, [health, isAnimatingHealth]);
  const focusColor = hasPenalty ? '#f87171' : '#38bdf8';
  const focusBorder = hasPenalty ? 'rgba(248, 113, 113, 0.55)' : 'rgba(56, 189, 248, 0.35)';
  const focusTooltip = hasPenalty
    ? 'Overload is reducing your Focus. Cast Wind runes to mitigate.'
    : hasWindMitigation
      ? `Wind runes (${windRuneCount}) are shielding you from Overload, keeping Focus intact.`
      : 'Focus - connect more runes to increase your multiplier.';

  const essenceTooltip = fireRuneCount > 0
    ? `Esence - cast more runes to increase spell damage. Fire runes (${fireRuneCount}) amplify your Essence.`
    : 'Esence - cast more runes to increase spell damage.';

  const spellpowerTooltip = `Spellpower - Essence (${essence}) × Focus (${focus}) = ${spellpower}. Increase spellpower to deal more damage.`;
  const healthTooltip = 'Health - drop to zero and your duel ends.';
  const healingTooltip = healing > 0
    ? `Life runes will restore ${healing} health every round.`
    : 'Healing - cast life runes to heal yourself every round.';

  const openExplanation = () => setShowExplanation(true);
  const closeExplanation = () => setShowExplanation(false);

  const clickableStatCommon = {
    onClick: openExplanation
  };

  return (
    <>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
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
        position: 'relative'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25em 1em',
        position: 'relative'
      }}>
      {/* Avatar */}
      <div
        style={{
          width: '5em',
          height: '5em',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${nameColor}`,
          background: `radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(15,23,42,0.9) 60%)`,
          color: '#f5f3ff',
          fontWeight: 700,
          fontSize: '18px',
          textTransform: 'uppercase',
          boxShadow: isActive ? '0 0 25px rgba(129, 140, 248, 0.45)' : 'none'
        }}
      >
        {playerName.slice(0,1)}
      </div>

      {/* Name */}
      <div style={{ color: '#f5f3ff', fontWeight: 600, fontSize: '1.2rem'}}>{playerName}</div>
      </div>
      {/* Health / Healing */}
      <div style={{ display: 'flex', gap: '0.25em', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <StatBadge
          type="health"
          label="Health"
          value={displayHealth}
          color="#fb7185"
          borderColor="rgba(248, 113, 113, 0.4)"
          tooltip={healthTooltip}
          pulseKey={healthPulse.key}
          pulseColor={healthPulse.color}
        />
        <StatBadge
          type="healing"
          label="Healing"
          value={healing}
          color="#4ade80"
          borderColor="rgba(74, 222, 128, 0.4)"
          tooltip={healingTooltip}
          pulseKey={healingPulse.key}
          pulseColor={healingPulse.color}
        />
      </div>

      {/* Essence / Focus / Spellpower */}
      <div style={{ display: 'flex', gap: '0.25em', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
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
          pulseKey={spellPulse.key}
          pulseColor={spellPulse.color}
          {...clickableStatCommon}
        />
      </div>
    </div>
    {showExplanation && <SpellpowerExplanation onClose={closeExplanation} />}
    </>
  );
}
