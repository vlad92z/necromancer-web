/**
 * TooltipView - displays a list of tooltip cards from gameplay state
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
import { useGameplayStore } from '../../../../state/stores/gameplayStore';
import { useSelectionStore } from '../../../../state/stores/selectionStore';
import { CardView } from './CardView';

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

export function TooltipView() {
  const tooltipCards = useGameplayStore((state) => state.tooltipCards);
  const selectedRunes = useSelectionStore((state) => state.selectedRunes);
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

  const firstCardId = activeTooltipCards[0]?.id ?? null;

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
  }, [activeTooltipCards.length, firstCardId]);

  
  function padding(n: number) {
    const p = measuredCardWidth * 1.21 * (1 - Math.exp(-0.158 * (n - 2.594)));
    return Math.round(p);
  }
  const overlapOffset = -padding(activeTooltipCards.length) - 10;;

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center px-2 overflow-visible">
      {activeTooltipCards.map((card, index) => {
        const rotation = getTooltipCardRotation(activeTooltipCards.length, index);
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
              imageSrc={card.imageSrc}
              description={card.description}
              runeType={card.runeType}
              runeRarity={card.runeRarity}
              variant={card.variant}
            />
          </div>
        );
      })}
    </div>
  );
}
