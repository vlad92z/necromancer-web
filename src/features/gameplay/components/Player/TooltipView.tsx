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
  const overlapOffset = -(activeTooltipCards.length * 20);

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
