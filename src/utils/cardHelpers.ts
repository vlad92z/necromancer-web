const STATIC_CW_ROTATION = 2;
const CARD_MAX_ROTATION = 8;
const CARD_OVERLAP_OFFSET = [-3, -3, -3, -3, -3, -3, -40, -70, -90, -110, -120, -130]

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
  return CARD_OVERLAP_OFFSET[cardsLength] ?? CARD_OVERLAP_OFFSET[CARD_OVERLAP_OFFSET.length - 1];
}