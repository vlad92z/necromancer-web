/**
 * Unit tests for legacy scoring-wall structure helpers.
 */

import { describe, expect, it } from 'vitest';
import type { ScoringWall } from '../types/game';
import {
  calculateSegmentSize,
  collectSegmentCells,
  getRuneOrderForSize,
  getWallColumnForRune,
} from './scoring';

describe('scoring wall helpers', () => {
  it('collects orthogonally connected wall cells only', () => {
    const wall = createWall(4);
    wall[0][0] = { runeType: 'Fire', effects: [] };
    wall[0][1] = { runeType: 'Life', effects: [] };
    wall[1][1] = { runeType: 'Void', effects: [] };
    wall[3][3] = { runeType: 'Frost', effects: [] };

    const cells = collectSegmentCells(wall, 0, 0);

    expect(cells).toHaveLength(3);
    expect(cells.map((cell) => `${cell.row}-${cell.col}`).sort()).toEqual([
      '0-0',
      '0-1',
      '1-1',
    ]);
    expect(calculateSegmentSize(wall, 3, 3)).toBe(1);
    expect(calculateSegmentSize(wall, 2, 2)).toBe(0);
  });

  it('maps rune columns using the active wall size order', () => {
    expect(getRuneOrderForSize(6)).toEqual(['Fire', 'Life', 'Wind', 'Frost', 'Void', 'Lightning']);
    expect(getWallColumnForRune(0, 'Void', 6)).toBe(4);
    expect(getWallColumnForRune(1, 'Void', 6)).toBe(5);
    expect(getWallColumnForRune(2, 'Void', 6)).toBe(0);
  });
});

function createWall(size: number): ScoringWall {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      runeType: null,
      effects: null,
    }))
  );
}
