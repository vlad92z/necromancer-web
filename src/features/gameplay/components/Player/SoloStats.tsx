/**
 * SoloStats component - displays vitals and rune stats with subtle Framer Motion animations
 */

import { StatBadge } from '../../../../components/StatBadge';
import deckSvg from '../../../../assets/stats/deck.svg';
import overloadSvg from '../../../../assets/stats/overload.svg';
import { buildTextTooltipCard } from '../../../../utils/tooltipCards';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';

export interface PlayerStatsProps {
  isActive: boolean;
  overloadMultiplier: number;
  game: number;
  deckCount?: number;
  overloadedRuneCount?: number;
}

export function PlayerStats({ overloadMultiplier, deckCount }: PlayerStatsProps) {
  const setTooltipCards = useGameplayStore((state) => state.setTooltipCards);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  const strainTooltip = `Overloading runes immediately deals ${overloadMultiplier} damage`;
  const deckTooltip = `Runes left in deck: ${deckCount ?? 0}`;

  const handleStrainTooltipToggle = (visible: boolean) => {
    if (visible) {
      setTooltipCards(buildTextTooltipCard('solo-overload-tooltip', 'Overload', strainTooltip, overloadSvg));
    } else {
      resetTooltipCards();
    }
  };

  const handleDeckTooltipToggle = (visible: boolean) => {
    if (visible) {
      setTooltipCards(buildTextTooltipCard('solo-deck-tooltip', 'Deck', deckTooltip, deckSvg));
    } else {
      resetTooltipCards();
    }
  };

  return (
    <div className="flex items-center gap-[0.9em] flex-wrap justify-start">
      <StatBadge
        label="Strain"
        value={overloadMultiplier ?? 0}
        color="#fa6060ff"
        borderColor="rgba(154, 147, 23, 0.35)"
        tooltip={strainTooltip}
        image={overloadSvg}
        onTooltipToggle={handleStrainTooltipToggle}
        showTooltipBubble={false}
      />
      <StatBadge
        label="Deck"
        value={deckCount ?? 0}
        color="#60a5fa"
        borderColor="rgba(96, 165, 250, 0.35)"
        tooltip={deckTooltip}
        image={deckSvg}
        onTooltipToggle={handleDeckTooltipToggle}
        showTooltipBubble={false}
      />
    </div>
  );
}
