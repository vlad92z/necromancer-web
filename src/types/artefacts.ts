/**
 * Artefact types and models for the Solo mode feature
 */

import tomePng from '../assets/artefacts/tome.png';
import ringPng from '../assets/artefacts/ring.png';
import robePng from '../assets/artefacts/robe.png';
import potionPng from '../assets/artefacts/potion.png';
import rodPng from '../assets/artefacts/rod.png';

export type ArtefactId = 'rod' | 'robe' | 'tome' | 'ring' | 'potion';

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
  rod: {
    id: 'rod',
    name: 'Rod of Retribution',
    cost: 500,
    image: rodPng,
  },
  robe: {
    id: 'robe',
    name: 'Weaver\'s Mantle',
    cost: 1000,
    image: robePng,
  },
  tome: {
    id: 'tome',
    name: 'Primer of Solitude',
    cost: 10000,
    image: tomePng,
  },
  ring: {
    id: 'ring',
    name: 'Signet of Fortune',
    cost: 20000,
    image: ringPng,
  },
  potion: {
    id: 'potion',
    name: 'Berserker Potion',
    cost: 50000,
    image: potionPng,
  },
};

/**
 * Get all artefacts as an array
 */
export function getAllArtefacts(): Artefact[] {
  return Object.values(ARTEFACTS);
}
