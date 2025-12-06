/**
 * RuneTypeTotals - displays rune icons with their total counts on the drafting table
 */
import type { RuneType } from '../../../../types/game';
import fireRune from '../../../../assets/runes/fire_rune.svg';
import frostRune from '../../../../assets/runes/frost_rune.svg';
import lifeRune from '../../../../assets/runes/life_rune.svg';
import voidRune from '../../../../assets/runes/void_rune.svg';
import windRune from '../../../../assets/runes/wind_rune.svg';
import lightningRune from '../../../../assets/runes/lightning_rune.svg';

const RUNE_ICONS: Record<RuneType, string> = {
  Fire: fireRune,
  Frost: frostRune,
  Life: lifeRune,
  Void: voidRune,
  Wind: windRune,
  Lightning: lightningRune,
};

interface RuneTypeTotalsProps {
  runeTypes: RuneType[];
  counts: Record<RuneType, number>;
  className?: string;
}

export function RuneTypeTotals({ runeTypes, counts, className }: RuneTypeTotalsProps) {
  return (
    <div className={`mt-3 flex items-center justify-center gap-3 rounded-[12px] bg-white/5 px-4 py-2.5 ${className ?? ''}`}>
      {runeTypes.map((runeType) => (
        <div
          key={runeType}
          className="flex min-w-[70px] items-center justify-center gap-2 rounded-[8px] border border-[rgba(255,255,255,0.12)] bg-white/5 px-3 py-1.5"
        >
          <div className="flex h-[26px] w-[26px] items-center justify-center">
            <img src={RUNE_ICONS[runeType]} alt={`${runeType}`} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-[16px] text-right text-sm font-bold tracking-wide text-slate-100">
            {counts[runeType] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}
