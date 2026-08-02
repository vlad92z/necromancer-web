/**
 * Artefact types and models for the Solo mode feature
 */

import tomePng from '../assets/artefacts/tome.png';
import ringPng from '../assets/artefacts/ring.png';
import robePng from '../assets/artefacts/robe.png';
import potionPng from '../assets/artefacts/potion.png';
import rodPng from '../assets/artefacts/rod.png';
import type { EffectRef } from './game';
import { createEffectRef } from '../utils/effectCatalog';

export type ArtefactId = 'rod' | 'robe' | 'tome' | 'ring' | 'potion';

export interface Artefact {
  id: ArtefactId;
  name: string;
  image: string; // path to png
  passiveEffectRefs: EffectRef[];
}

/**
 * Maximum number of artefacts that can be selected at once
 */
export const MAX_SELECTED_ARTEFACTS = 5;

/**
 * All available artefacts in the game
 */
export const ARTEFACTS: Record<ArtefactId, Artefact> = {
  potion: {
    id: 'potion',
    name: 'Frost Potion',
    image: potionPng,
    passiveEffectRefs: [createEffectRef('passive.potionShield', { shieldMultiplier: 2 })],
  },
  rod: {
    id: 'rod',
    name: 'Rod of Healing',
    image: rodPng,
    passiveEffectRefs: [createEffectRef('passive.rodHealing', { healingMultiplier: 2 })],
  },
  tome: {
    id: 'tome',
    name: 'Primer of Solitude',
    image: tomePng,
    passiveEffectRefs: [createEffectRef('passive.tomeCastDamage', { damageBonus: 1 })],
  },
  ring: {
    id: 'ring',
    name: 'Signet of Fortune',
    image: ringPng,
    passiveEffectRefs: [],
  },
  robe: {
    id: 'robe',
    name: 'Weaver\'s Mantle',
    image: robePng,
    passiveEffectRefs: [],
  },
};

/**
 * Get all artefacts as an array
 */
export function getAllArtefacts(): Artefact[] {
  return Object.values(ARTEFACTS);
}
