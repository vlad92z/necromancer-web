/**
 * Unit tests for scoring utilities with new rune effects
 */

import { describe, it, expect } from 'vitest';
import { resolveSegmentFromCells, type SegmentCell } from './scoring';

describe('scoring with new rune effects', () => {
  describe('Synergy effect', () => {
    it('should add damage for each synergyType rune in segment', () => {
      const cells: SegmentCell[] = [
        { row: 0, col: 0, runeType: 'Void', effects: [{ type: 'Synergy', amount: 1, synergyType: 'Void', rarity: 'uncommon' }] },
        { row: 0, col: 1, runeType: 'Void', effects: null },
        { row: 0, col: 2, runeType: 'Void', effects: null },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      // Base damage (3) + Synergy (1 * 3 Void runes) = 6
      expect(result.damage).toBe(6);
      expect(result.healing).toBe(0);
      expect(result.arcaneDust).toBe(0);
    });

    it('should work with Lightning synergy with Frost', () => {
      const cells: SegmentCell[] = [
        { row: 0, col: 0, runeType: 'Lightning', effects: [{ type: 'Synergy', amount: 1, synergyType: 'Frost', rarity: 'uncommon' }] },
        { row: 0, col: 1, runeType: 'Frost', effects: null },
        { row: 0, col: 2, runeType: 'Frost', effects: null },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      // Base damage (3) + Synergy (1 * 2 Frost runes) = 5
      expect(result.damage).toBe(5);
    });

    it('should not add damage if no synergyType runes in segment', () => {
      const cells: SegmentCell[] = [
        { row: 0, col: 0, runeType: 'Void', effects: [{ type: 'Synergy', amount: 1, synergyType: 'Void', rarity: 'uncommon' }] },
        { row: 0, col: 1, runeType: 'Fire', effects: null },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      // Base damage (2) + Synergy (1 * 1 Void rune) = 3
      expect(result.damage).toBe(3);
    });
  });

  describe('Fortune effect', () => {
    it('should add arcane dust', () => {
      const cells: SegmentCell[] = [
        { row: 0, col: 0, runeType: 'Wind', effects: [{ type: 'Fortune', amount: 1, rarity: 'uncommon' }] },
        { row: 0, col: 1, runeType: 'Wind', effects: null },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      expect(result.damage).toBe(2); // Base damage only
      expect(result.healing).toBe(0);
      expect(result.arcaneDust).toBe(1);
    });

    it('should accumulate multiple Fortune effects', () => {
      const cells: SegmentCell[] = [
        { row: 0, col: 0, runeType: 'Wind', effects: [{ type: 'Fortune', amount: 1, rarity: 'uncommon' }] },
        { row: 0, col: 1, runeType: 'Wind', effects: [{ type: 'Fortune', amount: 2, rarity: 'rare' }] },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      expect(result.arcaneDust).toBe(3);
    });
  });

  describe('Fragile effect', () => {
    it('should add damage if segment has no fragileType runes', () => {
      const cells: SegmentCell[] = [
        { row: 0, col: 0, runeType: 'Frost', effects: [{ type: 'Fragile', amount: 2, fragileType: 'Fire', rarity: 'uncommon' }] },
        { row: 0, col: 1, runeType: 'Frost', effects: null },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      // Base damage (2) + Fragile (2) = 4
      expect(result.damage).toBe(4);
      expect(result.healing).toBe(0);
      expect(result.arcaneDust).toBe(0);
    });

    it('should not add damage if segment has fragileType runes', () => {
      const cells: SegmentCell[] = [
        { row: 0, col: 0, runeType: 'Frost', effects: [{ type: 'Fragile', amount: 2, fragileType: 'Fire', rarity: 'uncommon' }] },
        { row: 0, col: 1, runeType: 'Fire', effects: null },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      // Base damage (2) only, no Fragile bonus
      expect(result.damage).toBe(2);
    });
  });

  describe('Combined effects', () => {
    it('should handle Damage + Synergy + Fortune together', () => {
      const cells: SegmentCell[] = [
        { 
          row: 0, 
          col: 0, 
          runeType: 'Void', 
          effects: [
            { type: 'Damage', amount: 1, rarity: 'uncommon' },
            { type: 'Synergy', amount: 1, synergyType: 'Void', rarity: 'uncommon' }
          ] 
        },
        { row: 0, col: 1, runeType: 'Void', effects: [{ type: 'Fortune', amount: 1, rarity: 'uncommon' }] },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      // Base damage (2) + Damage (1) + Synergy (1 * 2 Void runes) = 5
      expect(result.damage).toBe(5);
      expect(result.arcaneDust).toBe(1);
    });

    it('should handle all new effects together', () => {
      const cells: SegmentCell[] = [
        { 
          row: 0, 
          col: 0, 
          runeType: 'Void', 
          effects: [
            { type: 'Synergy', amount: 1, synergyType: 'Void', rarity: 'uncommon' }
          ] 
        },
        { row: 0, col: 1, runeType: 'Void', effects: [{ type: 'Fortune', amount: 2, rarity: 'uncommon' }] },
        { row: 0, col: 2, runeType: 'Lightning', effects: [{ type: 'Fragile', amount: 3, fragileType: 'Fire', rarity: 'uncommon' }] },
      ];
      
      const result = resolveSegmentFromCells(cells);
      
      // Base damage (3) + Synergy (1 * 2 Void runes) + Fragile (3, no Fire) = 8
      expect(result.damage).toBe(8);
      expect(result.arcaneDust).toBe(2);
    });
  });
});
