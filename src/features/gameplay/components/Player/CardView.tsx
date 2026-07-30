import type { RuneType, TooltipCardVariant } from '../../../../types/game';
import { WALL_SLOT_PLACEHOLDER_ASSETS } from '../../../../utils/wallSlotPlaceholders';

/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  title: string;
  description: string;
  imageSrc: string;
  runeTypes: RuneType[];
  variant?: TooltipCardVariant;
  size?: 'default' | 'hand' | 'compact';
  isSelected?: boolean;
  onClick?: () => void;
}

export function CardView({
  title,
  imageSrc,
  description,
  runeTypes,
  variant = 'default',
  size = 'default',
  isSelected = false,
  onClick,
}: CardViewProps) {
  const border = 'border-[3px] border-[#141313]';
  const singleRuneType = runeTypes.length === 1 ? runeTypes[0] : null;
  const typeBackgroundColor: Record<RuneType, string> = {
    Fire: '#8d3030',
    Life: '#3f7a4b',
    Wind: '#f5f2df',
    Frost: '#3d79aa',
    Void: '#654080',
    Lightning: '#bd7720',
  };
  const cardBackgroundColor = singleRuneType ? typeBackgroundColor[singleRuneType] : undefined;
  const titleTextColor = singleRuneType === 'Wind' ? 'text-[#141313]' : 'text-[#fff8d8]';
  const showDestroyedOverlay = variant === 'nonPrimary';
  const selectedClassName = isSelected
    ? 'translate-y-[-10px]'
    : '';
  const interactiveClassName = onClick
    ? 'cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#fff8d8] hover:translate-y-[-6px]'
    : '';
  const isSmallCard = size === 'hand' || size === 'compact';
  const sizeClassName = size === 'hand'
    ? 'h-72 w-48 flex-none p-1.5 gap-1.5'
    : size === 'compact'
      ? 'h-54 w-36 flex-none p-1 gap-1'
      : 'w-[clamp(14em,22vmin,24em)] aspect-2/3 p-2 gap-2';
  const descriptionClassName = isSmallCard
    ? `relative flex-4 ${border} bg-[#293532] px-2 pb-7 pt-2 font-pixel text-[10px] leading-snug text-[#fff8d8] whitespace-pre-line`
    : `relative flex-4 ${border} bg-[#293532] px-3 pb-9 pt-3 font-pixel text-xs leading-relaxed text-[#fff8d8] whitespace-pre-line`;
  const titleClassName = isSmallCard
    ? `px-2 py-1 font-pixel text-[10px] leading-tight ${titleTextColor}`
    : `px-3 py-2 font-pixel text-sm leading-tight ${titleTextColor}`;
  const className = `pixel-game-card flex flex-col rounded-[2px] ${sizeClassName} ${selectedClassName} ${interactiveClassName}`;

  const content = (
    <>
      <div className={titleClassName} style={{ backgroundColor: cardBackgroundColor }}>
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
        <div className="absolute bottom-1 right-1 flex items-end gap-1" role="group" aria-label={`Rune types: ${runeTypes.join(', ')}`}>
          {runeTypes.map((runeType) => (
            <img
              key={runeType}
              className={isSmallCard ? 'h-5 w-5 object-contain [image-rendering:pixelated]' : 'h-7 w-7 object-contain [image-rendering:pixelated]'}
              src={WALL_SLOT_PLACEHOLDER_ASSETS[runeType]}
              alt=""
            />
          ))}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={isSelected} data-selected={isSelected ? 'true' : undefined} className={className} style={{ backgroundColor: cardBackgroundColor }}>
        {content}
      </button>
    );
  }

  return (
    <div className={className} style={{ backgroundColor: cardBackgroundColor }}>
      {content}
    </div>
  );
}
