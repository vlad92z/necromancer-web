/**
 * SoloGameOverModal - displays the end-of-run summary for Solo mode
 */

import type { Player, SoloOutcome } from '../../../types/game';
import { useClickSound } from '../../../hooks/useClickSound';

interface SoloGameOverModalProps {
  player: Player;
  outcome: SoloOutcome;
  runePowerTotal: number;
  round: number;
  onReturnToStart?: () => void;
}

export function SoloGameOverModal({ player, outcome, runePowerTotal, round, onReturnToStart }: SoloGameOverModalProps) {
  const playClickSound = useClickSound();
  const heading = outcome === 'victory' ? 'Solo Victory' : outcome === 'defeat' ? 'Defeat' : 'Run Complete';
  const subline =
    outcome === 'victory'
      ? 'No runes remain to start a new round'
      : outcome === 'defeat'
        ? 'Your channel collapsed under overload'
        : 'The arena falls silent';
  const accentColor = outcome === 'victory' ? '#34d399' : outcome === 'defeat' ? '#f87171' : '#facc15';

  return (
    <div
      style={{
        background: 'rgba(6, 4, 18, 0.95)',
        borderRadius: '28px',
        padding: '32px 28px',
        minWidth: '360px',
        border: `1px solid ${accentColor}`,
        color: '#f8fafc',
        textAlign: 'center',
        boxShadow: '0 40px 90px rgba(0, 0, 0, 0.65)',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '12px',
          border: `1px solid ${accentColor}`,
          background: `linear-gradient(120deg, ${accentColor}22, rgba(126, 34, 206, 0.3))`,
          marginBottom: '16px',
          letterSpacing: '0.12em',
          fontSize: '12px',
          fontWeight: 800,
          textTransform: 'uppercase',
        }}
      >
        {heading}
      </div>
      <div style={{ color: '#cbd5e1', marginBottom: '22px', fontSize: '15px' }}>{subline}</div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <StatCard label="Health" value={`${player.health}/${player.maxHealth ?? player.health}`} accent="#34d399" />
        <StatCard label="Rounds Cleared" value={round} accent="#60a5fa" />
        <StatCard label="Rune Power" value={runePowerTotal} accent="#facc15" />
        <StatCard label="Player" value={player.name} accent="#a5b4fc" />
      </div>

      <button
        type="button"
        onClick={() => {
          playClickSound();
          onReturnToStart?.();
        }}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'linear-gradient(120deg, rgba(103, 232, 249, 0.18), rgba(56, 189, 248, 0.24))',
          color: '#e2e8f0',
          fontWeight: 700,
          letterSpacing: '0.08em',
          cursor: 'pointer',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
          transition: 'transform 120ms ease, box-shadow 120ms ease',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = 'translateY(-1px)';
          event.currentTarget.style.boxShadow = '0 22px 48px rgba(0, 0, 0, 0.6)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = 'translateY(0)';
          event.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.45)';
        }}
      >
        Back to Menu
      </button>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  accent: string;
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      style={{
        padding: '14px 12px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'rgba(226, 232, 240, 0.8)',
          marginBottom: '6px',
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}
