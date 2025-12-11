/**
 * TooltipView - displays a list of tooltip cards from gameplay state
 */

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

interface TooltipViewProps {
}

export function TooltipView(_: TooltipViewProps) {
  const tooltipCards = useGameplayStore((state) => state.tooltipCards);
  const overlapOffset = -60;

  return (
    <div className="relative w-full flex flex-nowrap items-center justify-center px-2 overflow-visible">
      {tooltipCards.map((card, index) => {
        const imageSrc = RUNE_CARD_IMAGES[card.runeType] ?? RUNE_CARD_IMAGES.Life;
        return (
          <div
            key={card.id}
            className="transition-transform duration-200 ease-out"
            style={{
              marginLeft: index === 0 ? 0 : overlapOffset,
              zIndex: tooltipCards.length - index,
            }}
          >
            <CardView
              title={card.title}
              imageSrc={imageSrc}
              description={card.description}
            />
          </div>
        );
      })}
    </div>
  );
}
