/**
 * SoloStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { StatBadge } from '../../../../components/StatBadge';
import deckSvg from '../../../../assets/stats/deck.svg';
import fatigueSvg from '../../../../assets/stats/fatigue.svg';

export interface SoloStatsProps {
  isActive: boolean;
  overloadMultiplier: number;
  round: number;
  deckCount?: number;
}

export function SoloStats({ overloadMultiplier, deckCount }: SoloStatsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '0.9em',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
      }}
    >
      <StatBadge
        label="Strain"
        value={overloadMultiplier ?? 0}
        color="#fa6060ff"
        borderColor="rgba(154, 147, 23, 0.35)"
        tooltip={`Overloading runes immediately deals ${overloadMultiplier} damage`}
        image={fatigueSvg}
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
