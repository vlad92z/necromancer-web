/**
 * SoloStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { StatBadge } from '../../../../components/StatBadge';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';

export interface PlayerStatsProps {
  isActive: boolean;
  overloadMultiplier: number;
  game: number;
  deckCount?: number;
}

export function PlayerStats({ overloadMultiplier, deckCount }: PlayerStatsProps) {
  return (
    <div className="flex items-center gap-[0.9em] flex-wrap justify-start">
      <StatBadge
        label="Strain"
        value={overloadMultiplier ?? 0}
        color="#fa6060ff"
        borderColor="rgba(154, 147, 23, 0.35)"
        tooltip={`Overloading runes immediately deals ${overloadMultiplier} damage`}
        image={overloadSvg}
      />
      <StatBadge
        label="Deck"
        value={deckCount ?? 0}
        color="#60a5fa"
        borderColor="rgba(96, 165, 250, 0.35)"
        tooltip={`Runes left in deck: ${deckCount ?? 0}`}
        image={deckSvg}
      />
    </div>
  );
}
