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
}

export function RuneTypeTotals({ runeTypes, counts }: RuneTypeTotalsProps) {
  return (
    <div
      style={{
        marginTop: '12px',
        padding: '10px 14px',
        borderRadius: `${RADIUS.lg}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      {runeTypes.map((runeType) => (
        <div
          key={runeType}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: `${RADIUS.md}px`,
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${COLORS.ui.border}`,
            minWidth: '70px',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={RUNE_ICONS[runeType]}
              alt={`${runeType} rune`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
          <div
            style={{
              color: COLORS.ui.text,
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '0.04em',
              minWidth: '16px',
              textAlign: 'right',
            }}
          >
            {counts[runeType] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}
