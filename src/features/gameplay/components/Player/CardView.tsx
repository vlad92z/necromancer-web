import type { RuneEffectRarity, RuneType, TooltipCardVariant } from '../../../../types/game';
import fireRune from '../../../../assets/runes/fire_rune.png';
import fireRuneUncommon from '../../../../assets/runes/fire_rune_uncommon.png';
import fireRuneRare from '../../../../assets/runes/fire_rune_rare.png';
import fireRuneEpic from '../../../../assets/runes/fire_rune_epic.png';
import frostRune from '../../../../assets/runes/frost_rune.png';
import frostRuneUncommon from '../../../../assets/runes/frost_rune_uncommon.png';
import frostRuneRare from '../../../../assets/runes/frost_rune_rare.png';
import frostRuneEpic from '../../../../assets/runes/frost_rune_epic.png';
import lifeRune from '../../../../assets/runes/life_rune.png';
import lifeRuneUncommon from '../../../../assets/runes/life_rune_uncommon.png';
import lifeRuneRare from '../../../../assets/runes/life_rune_rare.png';
import lifeRuneEpic from '../../../../assets/runes/life_rune_epic.png';
import voidRune from '../../../../assets/runes/void_rune.png';
import voidRuneUncommon from '../../../../assets/runes/void_rune_uncommon.png';
import voidRuneRare from '../../../../assets/runes/void_rune_rare.png';
import voidRuneEpic from '../../../../assets/runes/void_rune_epic.png';
import windRune from '../../../../assets/runes/wind_rune.png';
import windRuneUncommon from '../../../../assets/runes/wind_rune_uncommon.png';
import windRuneRare from '../../../../assets/runes/wind_rune_rare.png';
import windRuneEpic from '../../../../assets/runes/wind_rune_epic.png';
import lightningRune from '../../../../assets/runes/lightning_rune.png';
import lightningRuneUncommon from '../../../../assets/runes/lightning_rune_uncommon.png';
import lightningRuneRare from '../../../../assets/runes/lightning_rune_rare.png';
import lightningRuneEpic from '../../../../assets/runes/lightning_rune_epic.png';

/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  title: string;
  description: string;
  runeType: RuneType;
  imageSrc?: string;
  runeRarity?: RuneEffectRarity | null;
  variant?: TooltipCardVariant;
  size?: 'default' | 'hand';
  isSelected?: boolean;
  onClick?: () => void;
}

const RUNE_CARD_IMAGES: Record<RuneType, Record<RuneEffectRarity, string>> = {
  Fire: {
    common: fireRune,
    uncommon: fireRuneUncommon,
    rare: fireRuneRare,
    epic: fireRuneEpic,
  },
  Frost: {
    common: frostRune,
    uncommon: frostRuneUncommon,
    rare: frostRuneRare,
    epic: frostRuneEpic,
  },
  Life: {
    common: lifeRune,
    uncommon: lifeRuneUncommon,
    rare: lifeRuneRare,
    epic: lifeRuneEpic,
  },
  Void: {
    common: voidRune,
    uncommon: voidRuneUncommon,
    rare: voidRuneRare,
    epic: voidRuneEpic,
  },
  Wind: {
    common: windRune,
    uncommon: windRuneUncommon,
    rare: windRuneRare,
    epic: windRuneEpic,
  },
  Lightning: {
    common: lightningRune,
    uncommon: lightningRuneUncommon,
    rare: lightningRuneRare,
    epic: lightningRuneEpic,
  },
};

function resolveRuneImage(runeType: RuneType, runeRarity: RuneEffectRarity | null | undefined, override?: string): string {
  if (override) {
    return override;
  }

  const rarityKey = runeRarity ?? 'common';
  const runeImages = RUNE_CARD_IMAGES[runeType];
  return runeImages?.[rarityKey] ?? RUNE_CARD_IMAGES[runeType].common;
}

export function CardView({
  title,
  imageSrc,
  description,
  runeType,
  runeRarity,
  variant = 'default',
  size = 'default',
  isSelected = false,
  onClick,
}: CardViewProps) {
  const border = 'border-[3px] border-[#141313]';
  const showDestroyedOverlay = variant === 'nonPrimary';
  const resolvedImageSrc = resolveRuneImage(runeType, runeRarity, imageSrc);
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
  const className = `pixel-game-card flex flex-col ${sizeClassName} ${selectedClassName} ${interactiveClassName}`;

  const content = (
    <>
      <div className={`relative min-h-0 flex-4 overflow-hidden ${border} bg-[#202827]`}>
        <img
          className="h-full w-full object-cover [image-rendering:pixelated]"
          src={resolvedImageSrc}
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
