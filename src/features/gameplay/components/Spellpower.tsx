/**
 * Spellpower component - displays player vitals, scoring stats, and helpful tooltips
 */

import { useState } from 'react';
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
  onShowDeck: () => void;
  onShowLog: () => void;
  onShowRules: () => void;
}

function StatIcon({ type, color }: { type: StatIconType; color: string }) {
  const size = 26;
  const strokeProps = {
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  if (type === 'health') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path
          d="M12 21s-7-4.35-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.65-7 9-7 9Z"
          fill={color}
          opacity={0.9}
        />
      </svg>
    );
  }

  if (type === 'healing') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M12 5v14" {...strokeProps} />
        <path d="M5 12h14" {...strokeProps} />
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
        <path d="M12 18.5V21" {...strokeProps} />
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
}

function StatBadge({ type, label, value, color, borderColor, tooltip, onClick, alert }: StatBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isClickable = typeof onClick === 'function';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center'
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
          display: 'flex',
          alignItems: 'center',
          gap: '0.5em',
          padding: '0.6em 0.9em',
          background: 'rgba(8, 17, 35, 0.85)',
          borderRadius: '0.9rem',
          border: `1px solid ${borderColor}`,
          cursor: isClickable ? 'pointer' : 'default',
          color: '#f8fafc',
          minWidth: '7.5em',
          boxShadow: alert ? `0 0 20px rgba(248, 113, 113, 0.5)` : '0 8px 22px rgba(0,0,0,0.45)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          textAlign: 'left'
        }}
        aria-label={`${label}: ${tooltip}`}
      >
        <StatIcon type={type} color={color} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.08em', opacity: 0.75, textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 600 }}>{value}</span>
        </div>
      </button>
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(240px, 70vw)',
            padding: '10px 14px',
            background: 'rgba(3, 7, 18, 0.95)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5f5',
            fontSize: '0.78rem',
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
  const focusColor = hasPenalty ? '#f87171' : '#38bdf8';
  const focusBorder = hasPenalty ? 'rgba(248, 113, 113, 0.55)' : 'rgba(56, 189, 248, 0.35)';
  const focusTooltip = hasPenalty
    ? 'Overload is cutting into your Focus until you clear the floor. Keep penalties low to restore stable channels.'
    : hasWindMitigation
      ? `Wind runes (${windRuneCount}) are shielding you from overload, keeping Focus intact.`
      : 'Largest connected cluster on your wall. Stay precise to keep the flow of power.';

  const essenceTooltip = fireRuneCount > 0
    ? `All runes on the wall plus +${fireRuneCount} Essence from blazing Fire runes.`
    : 'Count of runes etched into your wall. Fire runes add bonus Essence—draft aggressively to grow it.';

  const spellpowerTooltip = `Essence (${essence}) × Focus (${focus}) = ${spellpower} spell damage this round. Tap for the full breakdown.`;
  const healthTooltip = 'Remaining vitality. Drop to zero and your duel ends.';
  const healingTooltip = healing > 0
    ? `Life runes will restore ${healing} HP at the end of the round.`
    : 'No Life runes are staged—no healing queued this round.';

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
      {/* Avatar */}
      <div
        style={{
          width: '4.4em',
          height: '4.4em',
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
      <div style={{ color: '#f5f3ff', fontWeight: 600, fontSize: '1.05rem' }}>{playerName}</div>

      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            padding: '4px 14px',
            borderRadius: '999px',
            background: 'rgba(250, 204, 21, 0.18)',
            border: '1px solid rgba(250, 204, 21, 0.4)',
            color: '#fde68a',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}
        >
          Active Turn
        </div>
      )}

      {/* Health / Healing */}
      <div style={{ display: 'flex', gap: '0.65em', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <StatBadge
          type="health"
          label="Health"
          value={health}
          color="#fb7185"
          borderColor="rgba(248, 113, 113, 0.4)"
          tooltip={healthTooltip}
        />
        <StatBadge
          type="healing"
          label="Healing"
          value={healing}
          color="#4ade80"
          borderColor="rgba(74, 222, 128, 0.4)"
          tooltip={healingTooltip}
        />
      </div>

      {/* Essence / Focus / Spellpower */}
      <div style={{ display: 'flex', gap: '0.65em', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
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
