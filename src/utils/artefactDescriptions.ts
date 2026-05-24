/**
 * Catalog-backed artefact tooltip description helpers.
 */

import { ARTEFACTS, type ArtefactId } from '../types/artefacts';
import { getEffectRefDescriptions } from './effectCatalog';

export function getArtefactEffectDescription(artefactId: ArtefactId): string {
  return getEffectRefDescriptions(ARTEFACTS[artefactId]?.passiveEffectRefs).join('\n');
}
