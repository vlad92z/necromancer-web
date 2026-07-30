import type { TooltipCardVariant } from '../../../../types/game';

/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  title: string;
  description: string;
  imageSrc: string;
  variant?: TooltipCardVariant;
  size?: 'default' | 'hand';
  isSelected?: boolean;
  onClick?: () => void;
}

export function CardView({
  title,
  imageSrc,
  description,
  variant = 'default',
  size = 'default',
  isSelected = false,
  onClick,
}: CardViewProps) {
  const border = 'border-[3px] border-[#141313]';
  const showDestroyedOverlay = variant === 'nonPrimary';
  const selectedClassName = isSelected
    ? 'translate-y-[-10px]'
    : '';
  const interactiveClassName = onClick
    ? 'cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#fff8d8] hover:translate-y-[-6px]'
    : '';
  const sizeClassName = size === 'hand'
    ? 'h-full max-h-72 w-auto min-w-0 aspect-2/3 p-1.5 gap-1.5'
    : 'w-[clamp(14em,22vmin,24em)] aspect-2/3 p-2 gap-2';
  const descriptionClassName = size === 'hand'
    ? `flex-4 ${border} bg-[#293532] px-2 py-2 font-pixel text-[10px] leading-snug text-[#fff8d8] whitespace-pre-line`
    : `flex-4 ${border} bg-[#293532] px-3 py-3 font-pixel text-xs leading-relaxed text-[#fff8d8] whitespace-pre-line`;
  const titleClassName = size === 'hand'
    ? `px-2 py-1 font-pixel text-[10px] leading-tight text-[#fff8d8]`
    : `px-3 py-2 font-pixel text-sm leading-tight text-[#fff8d8]`;
  const className = `pixel-game-card flex flex-col ${sizeClassName} ${selectedClassName} ${interactiveClassName}`;

  const content = (
    <>
      <div className={titleClassName}>
        {title}
      </div>

      <div className={`relative min-h-0 flex-4 overflow-hidden ${border} bg-[#202827]`}>
        <img
          className="h-full w-full object-cover [image-rendering:pixelated]"
          src={imageSrc}
          alt={title}
        />
        {showDestroyedOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage: 'linear-gradient(45deg, transparent 46%, rgba(70, 40, 100, 0.8) 46%, rgba(70, 40, 100, 0.8) 54%, transparent 54%)',
            }}
          />
        )}
      </div>

      <div className={descriptionClassName}>
        {description}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={isSelected} data-selected={isSelected ? 'true' : undefined} className={className}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}
