/**
 * TooltipView - displays the current combat hand as playable rune cards.
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useCombatZoneState } from '../../../../hooks/useGameState';
import { buildRuneTooltipCards } from '../../../../utils/tooltipCards';
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
  const { hand } = useCombatZoneState();
  const [selectedRuneId, setSelectedRuneId] = useState<string | null>(null);

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

  const firstCardId = handCards[0]?.card.id ?? null;

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
  }, [handCards.length, firstCardId]);

  
  function padding(n: number) {
    const p = measuredCardWidth * 1.21 * (1 - Math.exp(-0.158 * (n - 2.594)));
    return Math.round(p);
  }
  const overlapOffset = -padding(handCards.length) - 10;

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
    <div ref={containerRef} className="w-full h-full flex items-center justify-center px-2 overflow-visible">
      {handCards.map(({ rune, card }, index) => {
        const rotation = getTooltipCardRotation(handCards.length, index);
        const isSelected = selectedRuneId === rune.id;
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
              onClick={() => setSelectedRuneId((current) => current === rune.id ? null : rune.id)}
            />
          </div>
        );
      })}
    </div>
  );
}
