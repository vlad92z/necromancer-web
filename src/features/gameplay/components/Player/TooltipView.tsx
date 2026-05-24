/**
 * TooltipView - displays the current combat hand as playable rune cards.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGameplayActions } from '../../../../hooks/useGameActions';
import { useCombatZoneState } from '../../../../hooks/useGameState';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
import { CardView } from './CardView';

const STATIC_CW_ROTATION = 2;
const CARD_MAX_ROTATION = 6;

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
  const { hand, selectedHandRuneId } = useCombatZoneState();
  const { selectHandRune } = useGameplayActions();

  const handCards = useMemo(() => {
    const cards = buildRuneTooltipCards(hand);
    return hand.flatMap((rune, index) => {
      const card = cards[index];
      return card ? [{ rune, card }] : [];
    });
  }, [hand]);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [measuredCardWidth, setMeasuredCardWidth] = useState<number>(DEFAULT_CARD_WIDTH);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  const firstCardId = handCards[0]?.card.id ?? null;

  useLayoutEffect(() => {
    const measure = () => {
      const nextCardWidth = cardRef.current?.getBoundingClientRect().width;
      const nextContainerWidth = containerRef.current?.getBoundingClientRect().width;

      if (typeof nextCardWidth === 'number' && nextCardWidth > 0) {
        setMeasuredCardWidth(nextCardWidth);
      }

      if (typeof nextContainerWidth === 'number' && nextContainerWidth > 0) {
        setContainerWidth(nextContainerWidth);
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
  }, [handCards.length, firstCardId]);

  const availableWidth = Math.max(measuredCardWidth, containerWidth - 24);
  const minOverlap = Math.round(measuredCardWidth * 0.08);
  const maxOverlap = Math.round(measuredCardWidth * 0.52);
  const requiredOverlap = handCards.length > 1
    ? measuredCardWidth - (availableWidth - measuredCardWidth) / (handCards.length - 1)
    : 0;
  const overlapAmount = handCards.length > 1
    ? Math.min(maxOverlap, Math.max(minOverlap, Math.round(requiredOverlap)))
    : 0;
  const overlapOffset = -overlapAmount;

  if (handCards.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-sky-300/25 bg-sky-950/20 px-5 py-4 text-center">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/70">Hand</div>
          <div className="mt-2 text-lg font-bold text-sky-100">No runes in hand</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-visible px-2 pb-2">
      {handCards.map(({ rune, card }, index) => {
        const rotation = getTooltipCardRotation(handCards.length, index);
        const isSelected = selectedHandRuneId === rune.id;
        return (
          <div
            key={card.id}
            style={{ //This makes sure the cards overlap and are rotated
              marginLeft: index === 0 ? 0 : overlapOffset,
              zIndex: handCards.length - index,
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
              isSelected={isSelected}
              onClick={() => selectHandRune(rune.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
