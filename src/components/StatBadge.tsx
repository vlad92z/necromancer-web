/**
 * StatBadge - reusable stat display with tooltip and icon
 */
import { useState } from 'react';
import type { ReactNode } from 'react';

interface StatBadgeProps {
  label: string;
  value: ReactNode;
  color: string;
  borderColor: string;
  tooltip: string;
  image: string;
  onClick?: () => void;
  alert?: boolean;
}

function StatIcon({ name }: { name: string }) {
  return (
    <img
      src={name}
      alt=""
      aria-hidden
      style={{ display: 'inline-flex', width: 35, height: 35 }}
    />
  );
}

/**
 * StatBadge - shows a small icon, a value and a hover tooltip.
 */
export function StatBadge({ label, value, borderColor, tooltip, image, onClick, alert }: StatBadgeProps) {
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
        <StatIcon name={image} />
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
