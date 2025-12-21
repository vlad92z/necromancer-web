import { getRuneAsset } from '../../../../components/runeAssets';
import type { Rune, RuneRarity } from '../../../../types/game';
import { getRuneEffectDescription } from '../../../../utils/runeEffects';
import { getRuneTitle } from '../../../../utils/runeHelpers';

/**
 * CardView - displays a trading card style preview
 */

interface CardViewProps {
  rune: Rune,
  willBeDestroyed?: boolean,
  willBeOverloaded?: boolean,
  isPrimaryHover?: boolean,
}

const rarityBackgrounds: Record<RuneRarity, string> = {
  common: 'bg-slate-800',
  uncommon: 'bg-emerald-800',
  rare: 'bg-blue-800',
  epic: 'bg-purple-800',
};

/**
 * CardView - renders a rune card with rarity styling and overlays.
 */
export function CardView({
  rune,
  willBeDestroyed = false,
  willBeOverloaded = false,
  isPrimaryHover = false,
}: CardViewProps) {
  const border = 'border rounded-xl border-slate-400/40';
  const title = getRuneTitle(rune.runeType);
  const rarityBackground = rarityBackgrounds[rune.rarity];
  const hoverGlow = isPrimaryHover ? 'ring-2 ring-green-400 shadow-[0_0_16px_rgba(34,197,94,0.8)]' : '';

  return (
    <div className={`flex flex-col p-2 gap-2 w-[clamp(14em,22vmin,24em)] aspect-[2/3] ${border} ${rarityBackground} ${hoverGlow}`}>
      <div className="flex-[1] text-center text-sm font-semibold uppercase tracking-[0.22em] text-slate-100 pb-0">
        {title}
      </div>

      <div
        className={`flex-[4] ${border} bg-gradient-to-b from-slate-700/80 to-slate-900 overflow-hidden min-h-0 relative`}
        data-rune-card-image="true"
        data-rune-id={rune.id}
      >
        <img
          className="h-full w-full object-cover"
          src={getRuneAsset(rune)}
          alt={title}
        />
        {willBeDestroyed && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage: 'linear-gradient(45deg, transparent 46%, rgba(70, 40, 100, 0.8) 46%, rgba(70, 40, 100, 0.8) 54%, transparent 54%)',
            }}
          />
        )}
        {willBeOverloaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
            }}
          />
        )}
      </div>

      <div className={`flex-[4] ${border} bg-slate-950/70 px-3 py-3 tracking-[0.1em] leading-relaxed text-slate-100/90`}>
        {getRuneEffectDescription(rune.effect)}
      </div>
    </div>
  );
}
