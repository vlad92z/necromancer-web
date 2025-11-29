/**
 * SoloStatusBar - displays Solo mode health, rune power, and overload details
 */

import type React from 'react';

interface SoloStatusBarProps {
  health: number;
  maxHealth: number;
  runePowerTotal: number;
  overloadPenalty: number;
  overloadMultiplier: number;
  overloadDamage: number;
  round: number;
}

export function SoloStatusBar({
  health,
  maxHealth,
  runePowerTotal,
  overloadPenalty,
  overloadMultiplier,
  overloadDamage,
  round,
}: SoloStatusBarProps) {
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const badgeStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(120deg, rgba(82, 67, 170, 0.45), rgba(21, 94, 117, 0.6))',
    color: '#e2e8f0',
    minWidth: '160px',
    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'rgba(226, 232, 240, 0.75)',
    marginBottom: '6px',
    fontWeight: 700,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 800,
    color: '#f8fafc',
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '820px',
        display: 'flex',
        gap: '18px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 18px',
        background: 'rgba(8, 5, 20, 0.75)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '18px',
        boxShadow: '0 24px 72px rgba(0, 0, 0, 0.45)',
      }}
    >
      <div style={{ ...badgeStyle, flex: 1, minWidth: '200px' }}>
        <div style={labelStyle}>Health</div>
        <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>{health}/{maxHealth}</span>
          <div
            aria-label="Health remaining"
            style={{
              flex: 1,
              height: '10px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div
              style={{
                width: `${healthPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #34d399, #22d3ee)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
        <div style={{ marginTop: '6px', color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>
          Round {round}
        </div>
      </div>

      <div style={{ ...badgeStyle, minWidth: '180px', background: 'linear-gradient(120deg, rgba(234,179,8,0.35), rgba(59,130,246,0.35))' }}>
        <div style={labelStyle}>Rune Power</div>
        <div style={valueStyle}>{runePowerTotal}</div>
        <div style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '6px' }}>
          Total spellpower accumulated
        </div>
      </div>

      <div style={{ ...badgeStyle, minWidth: '200px', background: 'linear-gradient(120deg, rgba(239,68,68,0.35), rgba(59,130,246,0.32))' }}>
        <div style={labelStyle}>Overload</div>
        <div style={{ ...valueStyle, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span>{overloadPenalty}</span>
          <span style={{ fontSize: '13px', color: '#cbd5e1' }}>× {overloadMultiplier}</span>
        </div>
        <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px', fontWeight: 700 }}>
          Incoming damage: {overloadDamage}
        </div>
      </div>
    </div>
  );
}
