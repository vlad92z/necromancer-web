/**
 * RuneTypeTotals - displays rune icons with their total counts on the drafting table
 */
import type { RuneType } from '../../../../types/game';
import fireRune from '../../../../assets/runes/fire_rune.png';
import frostRune from '../../../../assets/runes/frost_rune.png';
import lifeRune from '../../../../assets/runes/life_rune.png';
import voidRune from '../../../../assets/runes/void_rune.png';
import windRune from '../../../../assets/runes/wind_rune.png';
import lightningRune from '../../../../assets/runes/lightning_rune.png';

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
}

export function RuneTypeTotals({ runeTypes, counts }: RuneTypeTotalsProps) {
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      {runeTypes.map((runeType) => (
        <div
          key={runeType}
          className="pixel-game-stat flex items-center justify-center gap-1 px-2 py-1"
        >
          <div className="flex h-[26px] w-[26px] items-center justify-center">
            <img src={RUNE_ICONS[runeType]} alt={`${runeType}`} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-[16px] text-right font-pixel text-xs text-[#fff8d8]">
            {counts[runeType] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}
