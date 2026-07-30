import type { Rune } from '../../../types/game';
import { buildRuneTooltipCards } from '../../../utils/tooltipCards';
import { CardView } from './Player/CardView';

interface WallRuneCardPreviewProps {
  rune: Rune | null;
}

/** Shows the original card for the rune currently hovered on a spell wall. */
export function WallRuneCardPreview({ rune }: WallRuneCardPreviewProps) {
  if (!rune) {
    return null;
  }

  const card = buildRuneTooltipCards([rune])[0];

  return (
    <div className="mt-4 flex justify-center">
      <CardView
        title={card.title}
        imageSrc={card.imageSrc}
        description={card.description}
        runeTypes={card.runeTypes}
        variant={card.variant}
        size="compact"
      />
    </div>
  );
}
