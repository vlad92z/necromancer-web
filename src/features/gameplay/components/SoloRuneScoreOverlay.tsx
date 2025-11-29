/**
 * SoloRuneScoreOverlay - displays the solo target and current rune score
 */

interface SoloRuneScoreOverlayProps {
  currentScore: number;
  targetScore: number;
}

export function SoloRuneScoreOverlay({ currentScore, targetScore }: SoloRuneScoreOverlayProps) {
  const progress = targetScore > 0 ? Math.min(1, currentScore / targetScore) : 0;
  const progressPercent = Math.round(progress * 100);
  const reachedTarget = currentScore >= targetScore;

  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '12px 14px',
        borderRadius: '14px',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        background: 'rgba(12, 10, 24, 0.78)',
        boxShadow: '0 14px 36px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
        // minWidth: '260px',
        flexDirection: 'column'
      }}
    >

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <div style={{ color: '#cbd5e1', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
            spell power
          </div>
          <div style={{ color: '#31b2d9ff', fontWeight: 800, fontSize: '16px' }}>
            {currentScore}
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
      </div>
    </div>
    
  );
}
