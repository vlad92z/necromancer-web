/**
 * Spellpower component - displays essence, focus, and spellpower stats
 */

import { } from 'react';

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

export function Spellpower({
  playerName,
  isActive,
  nameColor,
  health,
  healing,
  essence,
  focus,
  totalPower,
}: SpellpowerProps) {
  const spellpower = totalPower ?? (essence * focus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75em', minWidth: '8em' }}>
      {/* Avatar */}
      <div style={{
        width: '4em',
        height: '4em',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${nameColor}`,
        background: isActive ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.04)',
        color: '#f5f3ff',
        fontWeight: 700,
        fontSize: '18px',
        textTransform: 'uppercase'
      }}>{playerName.slice(0,1)}</div>

      {/* Name */}
      <div style={{ color: '#f5f3ff', fontWeight: 600 }}>{playerName}</div>

      {/* Health / Healing */}
      <div style={{ display: 'flex', gap: '0.5em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', padding: '0.5em 0.75em', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '0.5rem', border: '1px solid rgba(248, 113, 113, 0.3)' }}>
          <StatIcon type="health" color="#fb7185" />
          <span style={{ color: '#fff' }}>{health}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em', padding: '0.5em 0.75em', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '0.5rem', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
          <StatIcon type="health" color="#4ade80" />
          <span style={{ color: '#fff' }}>{`+${healing}`}</span>
        </div>
      </div>

      {/* Essence / Focus / Spellpower */}
      <div style={{ display: 'flex', gap: '0.5em' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em', padding: '0.5em', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '0.5rem', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          <StatIcon type="essence" color="#facc15" />
          <span style={{ color: '#fff' }}>{essence}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em', padding: '0.5em', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '0.5rem', border: '1px solid rgba(250, 204, 21, 0.25)' }}>
          <StatIcon type="focus" color="#38bdf8" />
          <span style={{ color: '#fff' }}>{focus}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25em', padding: '0.5em', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '0.5rem', border: '1px solid rgba(192, 132, 252, 0.25)' }}>
          <StatIcon type="spellpower" color="#c084fc" />
          <span style={{ color: '#fff' }}>{spellpower}</span>
        </div>
      </div>
    </div>
  );
}
