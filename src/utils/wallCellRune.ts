/**
 * Converts persisted wall cell rune data into display rune data for tooltips.
 */

import type { Rune, WallCell } from '../types/game';
import { copyEffectRefs } from './runeEffects';

type WallCellRuneSource = Pick<WallCell, 'runeType' | 'rarity' | 'castEffectRefs' | 'passiveEffectRefs'>;

export function wallCellToRune(cell: WallCellRuneSource, row: number, col: number): Rune | null {
  if (!cell.runeType) {
    return null;
  }

  return {
    id: `wall-${row}-${col}`,
    runeType: cell.runeType,
    rarity: cell.rarity ?? 'common',
    castEffectRefs: copyEffectRefs(cell.castEffectRefs),
    passiveEffectRefs: copyEffectRefs(cell.passiveEffectRefs),
  };
}
