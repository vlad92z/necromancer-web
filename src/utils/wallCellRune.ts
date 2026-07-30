/**
 * Converts persisted wall cell rune data into display rune data for tooltips.
 */

import type { Rune, WallCell } from '../types/game';
import { copyEffectRefs } from './runeEffects';

type WallCellRuneSource = Pick<WallCell, 'id' | 'runeTypes' | 'rarity' | 'castEffectRefs' | 'passiveEffectRefs'>;

export function wallCellToRune(cell: WallCellRuneSource, row: number, col: number): Rune | null {
  if (cell.runeTypes.length === 0) {
    return null;
  }

  return {
    id: cell.id ?? `wall-${row}-${col}`,
    runeTypes: [...cell.runeTypes],
    rarity: cell.rarity ?? 'common',
    castEffectRefs: copyEffectRefs(cell.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(cell.passiveEffectRefs),
  };
}
