/**
 * TooltipView - displays a list of tooltip cards from gameplay state
 */

import type { RuneType } from '../../../../types/game';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { CardView } from './CardView';
import { useRef, useLayoutEffect, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sampleCardRef = useRef<HTMLDivElement | null>(null);
  const [overlapOffset, setOverlapOffset] = useState<number>(-100);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const containerWidth = el.clientWidth;
      const cardsCount = tooltipCards.length;

      // If no cards or single card, no overlap needed
      if (cardsCount <= 1) {
        setOverlapOffset(0);
        return;
      }

      // Measure a sample card width if available, otherwise estimate via container height and Card aspect ratio (2/3)
      let cardWidth = sampleCardRef.current?.clientWidth ?? 0;
      if (!cardWidth) {
        const containerHeight = el.clientHeight || 0;
        // CardView uses aspect ratio 2/3 (width/height = 2/3)
        cardWidth = containerHeight * (2 / 3) || 0;
      }

      // If we can't measure, fall back to previous offset
      if (!cardWidth || !containerWidth) {
        setOverlapOffset((prev) => prev);
        return;
      }

      // Derivation:
      // totalWidth = cardWidth + (n-1)*(cardWidth + offset) <= containerWidth
      // => offset <= (containerWidth - cardWidth)/(n-1) - cardWidth
      const maxOffset = (containerWidth - cardWidth) / (cardsCount - 1) - cardWidth;

      // We prefer non-positive offsets (overlap) when needed. Allow small positive spacing if there's room.
      let offset = Math.min(maxOffset, 0);

      // Cap extreme overlaps so cards remain at least 10% visible
      const minOffset = -cardWidth * 0.9;
      if (offset < minOffset) offset = minOffset;

      setOverlapOffset(Math.round(offset));
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(containerRef.current);
    window.addEventListener('resize', compute);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [tooltipCards.length]);

  return (
    <div className="relative h-full w-full flex flex-nowrap items-center justify-center px-2 overflow-visible">
      {tooltipCards.map((card, index) => {
        const imageSrc = card.imageSrc ?? RUNE_CARD_IMAGES[card.runeType] ?? RUNE_CARD_IMAGES.Life;
        return (
          <div
            key={card.id}
            className="h-full transition-transform duration-200 ease-out"
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
