/**
 * Converts persisted wall cell rune data into display rune data for tooltips.
 */

import type { Rune, WallCell } from '../types/game';
import { copyEffectRefs } from './runeEffects';

type WallCellRuneSource = Pick<
  WallCell,
  'id' | 'name' | 'runeTypes' | 'rarity' | 'cardImageSrc' | 'tokenImageSrc' | 'manaCost' | 'castEffectRefs' | 'passiveEffectRefs'
>;

export function wallCellToRune(cell: WallCellRuneSource, row: number, col: number): Rune | null {
  if (cell.runeTypes.length === 0) {
    return null;
  }

  return {
    id: cell.id ?? `wall-${row}-${col}`,
    name: cell.name ?? `${cell.runeTypes[0]} Rune`,
    runeTypes: [...cell.runeTypes],
    rarity: cell.rarity ?? 'common',
    cardImageSrc: cell.cardImageSrc ?? '',
    tokenImageSrc: cell.tokenImageSrc ?? '',
    manaCost: cell.manaCost ?? 2,
    castEffectRefs: copyEffectRefs(cell.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(cell.passiveEffectRefs),
  };
}
