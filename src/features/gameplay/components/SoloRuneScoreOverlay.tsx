/**
 * SoloRuneScoreOverlay - displays the solo target and current rune score
 */

import { useState } from 'react';
import { SoloStats } from './Player/SoloStats';
import type { SoloStatsProps } from './Player/SoloStats';

interface SoloRuneScoreOverlayProps {
  currentScore: number;
  targetScore: number;
  stats: SoloStatsProps;
}

export function SoloRuneScoreOverlay({ currentScore, targetScore, stats }: SoloRuneScoreOverlayProps) {
  const [isSpellpowerHovered, setIsSpellpowerHovered] = useState(false);
  const progress = targetScore > 0 ? Math.min(1, currentScore / targetScore) : 0;
  const progressPercent = Math.round(progress * 100);
  const reachedTarget = currentScore >= targetScore;
  const spellpower = stats.totalPower;

  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px',
        borderRadius: '16px',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        background: 'rgba(12, 10, 24, 0.82)',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
        maxWidth: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <div style={{ color: '#cbd5e1', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
            Rune Score
          </div>
          <div style={{ color: reachedTarget ? '#34d399' : '#facc15', fontWeight: 800, fontSize: '16px' }}>
            {currentScore} / {targetScore}
          </div>
        </div>
        <div
          style={{
            height: '8px',
            borderRadius: '999px',
            background: 'rgba(148, 163, 184, 0.18)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${progressPercent}%`,
              borderRadius: '999px',
              background: reachedTarget ? 'linear-gradient(135deg, #34d399, #10b981)' : 'linear-gradient(135deg, #818cf8, #38bdf8)',
              boxShadow: reachedTarget ? '0 8px 18px rgba(52, 211, 153, 0.35)' : '0 8px 18px rgba(129, 140, 248, 0.35)',
              transition: 'width 180ms ease',
            }}
          />
        </div>
        <div
          onMouseEnter={() => setIsSpellpowerHovered(true)}
          onMouseLeave={() => setIsSpellpowerHovered(false)}
          onFocus={() => setIsSpellpowerHovered(true)}
          onBlur={() => setIsSpellpowerHovered(false)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', position: 'relative' }}
        >

          {isSpellpowerHovered && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: 'min(260px, 70vw)',
                padding: '10px 12px',
                background: 'rgba(3, 7, 18, 0.95)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#cbd5f5',
                fontSize: '12px',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                boxShadow: '0 14px 36px rgba(0,0,0,0.55)',
                zIndex: 40,
              }}
            >
              {`Spellpower\nEssence (${stats.essence}) × Focus (${stats.focus}) = ${spellpower}. Increase spellpower to deal more damage.`}
            </div>
          )}
        </div>
      </div>
      <SoloStats {...stats} />
    </div>
  );
}
