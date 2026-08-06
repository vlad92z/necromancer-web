import type { ScoringWall, WallCell } from '../types/game';

export const SPELL_WALL_SIDE_LENGTH = 5;

export function createEmptySpellWallCell(): WallCell {
  return {
    id: null,
    name: null,
    runeTypes: [],
    rarity: null,
    cardImageSrc: null,
    tokenImageSrc: null,
    spellSound: null,
    manaCost: null,
    castEffectRefs: null,
    passiveEffectRefs: null,
    shield: null,
  };
}

export function createEmptySpellWall(size: number = SPELL_WALL_SIDE_LENGTH): ScoringWall {
  return Array.from({ length: size }, () => (
    Array.from({ length: size }, createEmptySpellWallCell)
  ));
}
