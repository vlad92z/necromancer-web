const STATIC_CW_ROTATION = 2;
const CARD_MAX_ROTATION = 8;
const DEFAULT_CARD_WIDTH = 230;

export function getCardRotation(total: number, index: number): number {
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

export function getCardOverlap(cardsLength: number): number {
  const overlap = DEFAULT_CARD_WIDTH * 1.21 * (1 - Math.exp(-0.158 * (cardsLength - 2.594)));
  return -overlap + 50;
}