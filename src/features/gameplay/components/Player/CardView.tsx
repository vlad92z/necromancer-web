import type { RuneEffectRarity, RuneType, TooltipCardVariant } from '../../../../types/game';
import fireRune from '../../../../assets/runes/fire_rune.svg';
import fireRuneUncommon from '../../../../assets/runes/fire_rune_uncommon.svg';
import fireRuneRare from '../../../../assets/runes/fire_rune_rare.svg';
import fireRuneEpic from '../../../../assets/runes/fire_rune_epic.svg';
import frostRune from '../../../../assets/runes/frost_rune.svg';
import frostRuneUncommon from '../../../../assets/runes/frost_rune_uncommon.svg';
import frostRuneRare from '../../../../assets/runes/frost_rune_rare.svg';
import frostRuneEpic from '../../../../assets/runes/frost_rune_epic.svg';
import lifeRune from '../../../../assets/runes/life_rune.svg';
import lifeRuneUncommon from '../../../../assets/runes/life_rune_uncommon.svg';
import lifeRuneRare from '../../../../assets/runes/life_rune_rare.svg';
import lifeRuneEpic from '../../../../assets/runes/life_rune_epic.svg';
import voidRune from '../../../../assets/runes/void_rune.svg';
import voidRuneUncommon from '../../../../assets/runes/void_rune_uncommon.svg';
import voidRuneRare from '../../../../assets/runes/void_rune_rare.svg';
import voidRuneEpic from '../../../../assets/runes/void_rune_epic.svg';
import windRune from '../../../../assets/runes/wind_rune.svg';
import windRuneUncommon from '../../../../assets/runes/wind_rune_uncommon.svg';
import windRuneRare from '../../../../assets/runes/wind_rune_rare.svg';
import windRuneEpic from '../../../../assets/runes/wind_rune_epic.svg';
import lightningRune from '../../../../assets/runes/lightning_rune.svg';
import lightningRuneUncommon from '../../../../assets/runes/lightning_rune_uncommon.svg';
import lightningRuneRare from '../../../../assets/runes/lightning_rune_rare.svg';
import lightningRuneEpic from '../../../../assets/runes/lightning_rune_epic.svg';

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
  const border = 'border rounded-xl border-slate-400/40';
  const showDestroyedOverlay = variant === 'nonPrimary';
  const resolvedImageSrc = resolveRuneImage(runeType, runeRarity, imageSrc);
  const selectedClassName = isSelected
    ? 'ring-4 ring-sky-300 shadow-[0_0_38px_rgba(125,211,252,0.75)] translate-y-[-10px]'
    : 'shadow-[0_10px_28px_rgba(0,0,0,0.28)]';
  const interactiveClassName = onClick
    ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 hover:translate-y-[-6px]'
    : '';
  const sizeClassName = size === 'hand'
    ? 'h-full max-h-[18rem] w-auto min-w-0 aspect-[2/3] p-1.5 gap-1.5'
    : 'w-[clamp(14em,22vmin,24em)] aspect-[2/3] p-2 gap-2';
  const titleClassName = size === 'hand'
    ? 'flex-[1] text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-100 pb-0'
    : 'flex-[1] text-center text-sm font-semibold uppercase tracking-[0.22em] text-slate-100 pb-0';
  const descriptionClassName = size === 'hand'
    ? `flex-[4] ${border} bg-slate-950/70 px-2 py-2 text-xs tracking-[0.06em] leading-snug text-slate-100/90`
    : `flex-[4] ${border} bg-slate-950/70 px-3 py-3 tracking-[0.1em] leading-relaxed text-slate-100/90`;
  const className = `flex flex-col ${sizeClassName} ${border} bg-gray-900 transition duration-150 ease-out ${selectedClassName} ${interactiveClassName}`;

  const content = (
    <>
      <div className={titleClassName}>
        {title}
      </div>

      <div className={`flex-[4] ${border} bg-gradient-to-b from-slate-700/80 to-slate-900 overflow-hidden min-h-0 relative`}>
        <img
          className="h-full w-full object-cover"
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
      <button type="button" onClick={onClick} aria-pressed={isSelected} className={className}>
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
