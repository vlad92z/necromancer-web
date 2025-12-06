/**
 * Artefact types and models for the Solo mode feature
 */

import tomePng from '../assets/artefacts/tome.png';
import ringPng from '../assets/artefacts/ring.png';
import robePng from '../assets/artefacts/robe.png';
import potionPng from '../assets/artefacts/potion.png';
import rodPng from '../assets/artefacts/rod.png';

export type ArtefactId = 'tome' | 'ring' | 'robe' | 'potion' | 'rod';

export interface Artefact {
  id: ArtefactId;
  name: string;
  cost: number; // Arcane Dust
  image: string; // path to png
}

/**
 * Maximum number of artefacts that can be selected at once
 */
export const MAX_SELECTED_ARTEFACTS = 5;

/**
 * All available artefacts in the game
 */
export const ARTEFACTS: Record<ArtefactId, Artefact> = {
  tome: {
    id: 'tome',
    name: 'Tome',
    cost: 100,
    image: tomePng,
  },
  ring: {
    id: 'ring',
    name: 'Ring',
    cost: 100,
    image: ringPng,
  },
  robe: {
    id: 'robe',
    name: 'Robe',
    cost: 100,
    image: robePng,
  },
  potion: {
    id: 'potion',
    name: 'Potion',
    cost: 100,
    image: potionPng,
  },
  rod: {
    id: 'rod',
    name: 'Rod',
    cost: 100,
    image: rodPng,
  },
};

/**
 * Get all artefacts as an array
 */
export function getAllArtefacts(): Artefact[] {
  return Object.values(ARTEFACTS);
}
