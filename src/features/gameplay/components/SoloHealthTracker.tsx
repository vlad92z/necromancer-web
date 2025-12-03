/**
 * SoloHealthTracker - displays the player's health with a red progress indicator for solo runs
 */
interface SoloHealthTrackerProps {
  health: number;
  maxHealth?: number;
}

export function SoloHealthTracker({ health, maxHealth }: SoloHealthTrackerProps) {
  const healthCap = Math.max(1, maxHealth ?? health);
  const clampedHealth = Math.max(0, Math.min(health, healthCap));
  const progressPercent = Math.round((clampedHealth / healthCap) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 14px',
        borderRadius: '14px',
        border: '1px solid rgba(248, 113, 113, 0.3)',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.42)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div
          style={{
            color: '#cbd5e1',
            fontSize: '12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          Health
        </div>
        <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '18px', minWidth: '32px', textAlign: 'right' }}>
          {clampedHealth}
        </div>
      </div>
      <div
        style={{
          height: '10px',
          borderRadius: '999px',
          background: 'rgba(248, 113, 113, 0.16)',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.35)',
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
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            boxShadow: '0 10px 24px rgba(239, 68, 68, 0.25)',
            transition: 'width 180ms ease',
          }}
        />
      </div>
    </div>
  );
}
