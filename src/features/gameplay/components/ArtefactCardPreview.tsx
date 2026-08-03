import type { ArtefactId } from '../../../types/artefacts';
import { ARTEFACTS } from '../../../types/artefacts';
import { getArtefactEffectDescription } from '../../../utils/artefactDescriptions';
import { CardView } from './Player/CardView';

interface ArtefactCardPreviewProps {
  artefactId: ArtefactId | null;
}

/** Shows the full artefact card in the same player-panel preview position as wall-rune cards. */
export function ArtefactCardPreview({ artefactId }: ArtefactCardPreviewProps) {
  if (!artefactId) return null;
  const artefact = ARTEFACTS[artefactId];
  if (!artefact) return null;

  return (
    <div className="mt-4 flex justify-center">
      <CardView
        title={artefact.name}
        imageSrc={artefact.image}
        description={getArtefactEffectDescription(artefactId)}
        runeTypes={[]}
        size="compact"
      />
    </div>
  );
}
