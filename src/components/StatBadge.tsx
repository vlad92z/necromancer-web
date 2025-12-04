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
      aria-hidden={true}
      className="inline-flex w-[35px] h-[35px]"
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
    <div className="relative flex justify-center">
      <button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        onClick={onClick}
        className={
          `flex items-center px-2 py-2 min-w-[110px] rounded-[0.6rem] bg-[rgba(8,17,35,0.85)] text-slate-50 transition-shadow` +
          (isClickable ? ' cursor-pointer' : ' cursor-default')
        }
        style={{ border: `1px solid ${borderColor}`, boxShadow: baseShadow }}
        aria-label={`${label}: ${tooltip}`}
      >
        <StatIcon name={image} />
        <div className="flex flex-col leading-[1.2] ml-2">
          <span className="text-[1.15rem] font-semibold">{value}</span>
        </div>
      </button>
      {isHovered && (
        <div
          className={
            'absolute left-1/2 transform -translate-x-1/2 p-[10px] px-[14px] rounded-[12px] border border-white/12 text-slate-300 text-[1rem] leading-[1.6] whitespace-pre-wrap shadow-[0_20px_45px_rgba(0,0,0,0.55)] z-50 bg-[rgba(3,7,18,0.95)]'
          }
          style={{ bottom: 'calc(100% + 8px)', width: 'min(240px, 70vw)' }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
