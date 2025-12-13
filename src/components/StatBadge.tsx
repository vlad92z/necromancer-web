/**
 * StatBadge - reusable stat display with tooltip and icon
 */
import type { ReactNode } from 'react';

interface StatBadgeProps {
  value: ReactNode;
  className: string;
  image: string;
  onClick?: () => void;
  onTooltipToggle?: (isVisible: boolean) => void;
}

/**
 * StatBadge - shows a small icon, a value and a hover tooltip.
 */
export function StatBadge({
  value,
  className,
  image,
  onClick,
  onTooltipToggle,
}: StatBadgeProps) {
  const handleHoverChange = (visible: boolean) => {
    if (onTooltipToggle) {
      onTooltipToggle(visible);
    }
  };

  return (
    <button
      type="button"
      onMouseEnter={() => handleHoverChange(true)}
      onMouseLeave={() => handleHoverChange(false)}
      onFocus={() => handleHoverChange(true)}
      onBlur={() => handleHoverChange(false)}
      onClick={onClick}
      className={className}
    >
      <img
        src={image}
        aria-hidden={true}
        className="inline-flex w-[35px] h-[35px]"
      />
      <div className="flex flex-col leading-[1.2] ml-2">
        <span className="text-[1.15rem] font-semibold">{value}</span>
      </div>
    </button>
  );
}
