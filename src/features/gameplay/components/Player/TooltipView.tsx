/**
 * TooltipView - displays a list of tooltip cards from gameplay state
 */

import { useEffect, useMemo } from 'react';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
import type { RuneType } from '../../../../types/game';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { CardView } from './CardView';
import fireRune from '../../../../assets/runes/fire_rune.svg';
import frostRune from '../../../../assets/runes/frost_rune.svg';
import lifeRune from '../../../../assets/runes/life_rune.svg';
import voidRune from '../../../../assets/runes/void_rune.svg';
import windRune from '../../../../assets/runes/wind_rune.svg';
import lightningRune from '../../../../assets/runes/lightning_rune.svg';

const overlapMap = new Map([
  [0, 10],
  [1, 10],
  [2, 10],
  [3, 10],
  [4, 10],
  [5, 60],
  [6, 100],
  [7, 120],
  [8, 145],
  [9, 150],
  [10, 160],
  [11, 170],
  [12, 180],
  [13, 180],
  [14, 190],
  [15, 190],
  [16, 200],
  [17, 200],
  [18, 210],
  [19, 220]
]);

const RUNE_CARD_IMAGES: Record<RuneType, string> = {
  Fire: fireRune,
  Frost: frostRune,
  Life: lifeRune,
  Void: voidRune,
  Wind: windRune,
  Lightning: lightningRune,
};

export function TooltipView() {
  const tooltipCards = useGameplayStore((state) => state.tooltipCards);
  const selectedRunes = useGameplayStore((state) => state.selectedRunes);
  const tooltipOverrideActive = useGameplayStore((state) => state.tooltipOverrideActive);
  const resetTooltipCards = useGameplayStore((state) => state.resetTooltipCards);
  useEffect(() => {
    if (selectedRunes.length === 0 && tooltipOverrideActive) {
      resetTooltipCards();
    }
  }, [resetTooltipCards, selectedRunes.length, tooltipOverrideActive]);

  const activeTooltipCards = useMemo(() => {
    if (selectedRunes.length > 0 && !tooltipOverrideActive) {
      const primaryRuneId = selectedRunes[0].id;
      return buildRuneTooltipCards(selectedRunes, primaryRuneId);
    }
    return tooltipCards;
  }, [selectedRunes, tooltipCards, tooltipOverrideActive]);
  const overlapOffset = -(overlapMap.get(activeTooltipCards.length) ?? 230);

  return (
    <div className="relative h-full w-full flex flex-nowrap items-center justify-center px-2 overflow-visible">
      {activeTooltipCards.map((card, index) => {
        const imageSrc = card.imageSrc ?? RUNE_CARD_IMAGES[card.runeType] ?? RUNE_CARD_IMAGES.Life;
        return (
          <div
            key={card.id}
            className="h-full flex-shrink-0 transition-transform duration-200 ease-out"
            style={{
              marginLeft: index === 0 ? 0 : overlapOffset,
              zIndex: tooltipCards.length - index,
            }}
          >
            <CardView
              title={card.title}
              imageSrc={imageSrc}
              description={card.description}
              variant={card.variant}
            />
          </div>
        );
      })}
    </div>
  );
}
