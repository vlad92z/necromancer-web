import type { RuneType, TooltipCardVariant } from '../../../../types/game';

/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  title: string;
  description: string;
  imageSrc: string;
  manaCost?: number;
  runeTypes: RuneType[];
  variant?: TooltipCardVariant;
  size?: 'default' | 'hand' | 'compact';
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function CardView({
  title,
  imageSrc,
  manaCost,
  description,
  runeTypes,
  variant = 'default',
  size = 'default',
  isSelected = false,
  disabled = false,
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
  const manaType = runeTypes[0] ?? null;
  const manaBackgroundColor = manaType ? typeBackgroundColor[manaType] : '#9ed9f5';
  const manaTextColor = manaType === 'Wind' ? '#141313' : '#fff8d8';
  const titleTextColor = singleRuneType === 'Wind' ? 'text-[#141313]' : 'text-[#fff8d8]';
  const showDestroyedOverlay = variant === 'nonPrimary';
  const selectedClassName = isSelected
    ? 'translate-y-[-10px] ring-4 ring-[#f2c14e] ring-offset-2 ring-offset-[#141313]'
    : '';
  const interactiveClassName = onClick && !disabled
    ? 'cursor-pointer focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#fff8d8] hover:translate-y-[-6px]'
    : disabled ? 'cursor-not-allowed opacity-60' : '';
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
        {manaCost !== undefined && (
          <span
            className={isSmallCard
              ? 'absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#141313] font-pixel text-[10px]'
              : 'absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#141313] font-pixel text-xs'}
            style={{ backgroundColor: manaBackgroundColor, color: manaTextColor }}
            aria-label={`${manaCost} mana, ${runeTypes.join(' / ')} rune type`}
          >
            {manaCost}
          </span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" disabled={disabled} onClick={onClick} aria-pressed={isSelected} data-selected={isSelected ? 'true' : undefined} className={className} style={{ backgroundColor: cardBackgroundColor }}>
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
