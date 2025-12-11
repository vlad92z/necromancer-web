/**
 * StatBadge - reusable stat display with tooltip and icon
 */
import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';

interface StatBadgeProps {
  label: string;
  value: ReactNode;
  color: string;
  borderColor: string;
  tooltip: string;
  image: string;
  onClick?: () => void;
  alert?: boolean;
  canOverload?: boolean;
  onTooltipToggle?: (isVisible: boolean) => void;
  showTooltipBubble?: boolean;
}

// Constants for glow animation
const SELECTABLE_GLOW_REST = '0 0 20px rgba(248, 113, 113, 0.75), 0 0 40px rgba(239, 68, 68, 0.45)';
const SELECTABLE_GLOW_PEAK = '0 0 32px rgba(239, 68, 68, 0.95), 0 0 60px rgba(185, 28, 28, 0.55)';
const SELECTABLE_GLOW_RANGE: [string, string] = [SELECTABLE_GLOW_REST, SELECTABLE_GLOW_PEAK];

const PULSE_TRANSITION: Transition = {
  duration: 1.2,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const
};

/**
 * StatBadge - shows a small icon, a value and a hover tooltip.
 */
export function StatBadge({
  label,
  value,
  borderColor,
  tooltip,
  image,
  onClick,
  alert,
  canOverload,
  onTooltipToggle,
  showTooltipBubble = true,
}: StatBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isClickable = typeof onClick === 'function';
  const baseShadowClass = alert ? 'shadow-[0_0_16px_rgba(248,113,113,0.4)]' : 'shadow-[0_10px_26px_rgba(0,0,0,0.45)]';

  // Memoize animation properties to avoid recreating on every render
  const buttonMotionProps = useMemo(() => 
    canOverload
      ? {
          animate: { boxShadow: SELECTABLE_GLOW_RANGE },
          transition: PULSE_TRANSITION
        }
      : {}
  , [canOverload]);

  const buttonStyle = useMemo(() => 
    canOverload
      ? { borderColor, boxShadow: SELECTABLE_GLOW_REST }
      : { borderColor }
  , [canOverload, borderColor]);

  const ButtonComponent = canOverload ? motion.button : 'button';

  const handleHoverChange = (visible: boolean) => {
    setIsHovered(visible);
    if (onTooltipToggle) {
      onTooltipToggle(visible);
    }
  };

  return (
    <div className="relative flex justify-center">
      <ButtonComponent
        type="button"
        onMouseEnter={() => handleHoverChange(true)}
        onMouseLeave={() => handleHoverChange(false)}
        onFocus={() => handleHoverChange(true)}
        onBlur={() => handleHoverChange(false)}
        onClick={onClick}
        className={`flex min-w-[110px] items-center rounded-[0.6rem] border bg-[rgba(8,17,35,0.85)] px-2 py-2 text-slate-50 transition-shadow ${baseShadowClass} ${
          isClickable ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={buttonStyle}
        aria-label={canOverload ? `${label}: Click to overload runes. ${tooltip}` : `${label}: ${tooltip}`}
        {...buttonMotionProps}
      >
        <img
          src={image}
          aria-hidden={true}
          className="inline-flex w-[35px] h-[35px]"
        />
        <div className="flex flex-col leading-[1.2] ml-2">
          <span className="text-[1.15rem] font-semibold">{value}</span>
        </div>
      </ButtonComponent>
      {showTooltipBubble && isHovered && (
        <div
          className="absolute left-1/2 bottom-[calc(100%+8px)] w-[min(240px,70vw)] -translate-x-1/2 transform rounded-[12px] border border-white/12 bg-[rgba(3,7,18,0.95)] px-[14px] py-[10px] text-[1rem] leading-[1.6] text-slate-300 shadow-[0_20px_45px_rgba(0,0,0,0.55)] drop-shadow-lg"
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}
