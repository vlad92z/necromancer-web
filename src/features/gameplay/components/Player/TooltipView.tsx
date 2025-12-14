/**
 * TooltipView - displays a list of tooltip cards from gameplay state
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

const STATIC_CW_ROTATION = 2;
const CARD_MAX_ROTATION = 8;

const getTooltipCardRotation = (total: number, index: number): number => {
  if (total <= 1) {
    return STATIC_CW_ROTATION;
  }

  const leftCount = Math.floor(total / 2);
  const rightCount = total - leftCount;

  if (index < leftCount) {
    const leftPosition = leftCount - index;
    const ratio = leftPosition / (leftCount + 1);
    return -CARD_MAX_ROTATION * ratio;
  }

  const rightIndex = index - leftCount;
  const ratio = (rightIndex + 1) / (rightCount + 1);
  return CARD_MAX_ROTATION * ratio;
};

const DEFAULT_CARD_WIDTH = 230;

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

  const cardRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredCardWidth, setMeasuredCardWidth] = useState<number>(DEFAULT_CARD_WIDTH);

  useLayoutEffect(() => {
    const measure = () => {
      const width = cardRef.current?.getBoundingClientRect().width;
      if (typeof width === 'number' && width > 0) {
        setMeasuredCardWidth(width);
      }
    };

    if (typeof window === 'undefined') {
      return undefined;
    }

    measure();
    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeTooltipCards.length, activeTooltipCards[0]?.id]);

  
  function padding(n: number) {
    const p = measuredCardWidth * 1.21 * (1 - Math.exp(-0.158 * (n - 2.594)));
    return Math.round(p);
  }
  const overlapOffset = -padding(activeTooltipCards.length) - 10;;

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center px-2 overflow-visible">
      {activeTooltipCards.map((card, index) => {
        const rotation = getTooltipCardRotation(activeTooltipCards.length, index);
        const imageSrc = card.imageSrc ?? RUNE_CARD_IMAGES[card.runeType] ?? RUNE_CARD_IMAGES.Life;
        return (
          <div
            key={card.id}
            style={{ //This makes sure the cards overlap and are rotated
              marginLeft: index === 0 ? 0 : overlapOffset,
              zIndex: tooltipCards.length - index,
              transform: `rotate(${rotation}deg)`,
            }}
            ref={index === 0 ? cardRef : null}
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
