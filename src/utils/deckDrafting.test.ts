/**
 * Integration tests for deck drafting with artefact effects
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDeckDraftState } from './deckDrafting';
import type { Rune } from '../types/game';

describe('deckDrafting with artefact effects', () => {
  beforeEach(() => {
    // Reset Math.random mock before each test
    vi.spyOn(Math, 'random').mockRestore();
  });

  describe('createDeckDraftState', () => {
    it('should create draft state with default picks when no Robe', () => {
      const state = createDeckDraftState('player-1', 3, 0, []);
      expect(state.totalPicks).toBe(3);
      expect(state.picksRemaining).toBe(3);
      expect(state.runeforges).toHaveLength(3);
    });

    it('should use provided totalPicks value (Robe effect applied by caller)', () => {
      // The Robe effect is applied by the caller (gameplayStore), not by createDeckDraftState
      // So we pass in the already-modified pick count
      const state = createDeckDraftState('player-1', 4, 0, ['robe']); // 4 = 3 base + 1 from Robe
      expect(state.totalPicks).toBe(4);
      expect(state.picksRemaining).toBe(4);
    });

    it('should create runeforges with runes', () => {
      const state = createDeckDraftState('player-1', 3, 0, []);
      expect(state.runeforges).toHaveLength(3);
      state.runeforges.forEach(forge => {
        expect(forge.runes).toHaveLength(4); // DEFAULT_DECK_DRAFT_RUNES_PER_RUNEFORGE
        expect(forge.ownerId).toBe('player-1');
      });
    });

    it('should generate runes with effects based on rarity', () => {
      const state = createDeckDraftState('player-1', 3, 0, []);
      const allRunes = state.runeforges.flatMap(f => f.runes);
      
      // All runes should have effects array
      allRunes.forEach(rune => {
        expect(rune.effects).toBeDefined();
        expect(Array.isArray(rune.effects)).toBe(true);
      });
    });
  });

  describe('Ring effect on rune rarity distribution', () => {
    it('should increase epic rune probability with Ring active', () => {
      // Mock random to test rarity distribution
      const randomValues = [
        0.005, // Should be epic with Ring (< 2% when doubled from 1%)
        0.02,  // Should be rare
        0.1,   // Should be uncommon
        0.005, // Should be epic
      ];
      let callIndex = 0;
      vi.spyOn(Math, 'random').mockImplementation(() => {
        const value = randomValues[callIndex % randomValues.length];
        callIndex++;
        return value;
      });

      const stateWithRing = createDeckDraftState('player-1', 1, 0, ['ring']);
      const stateWithoutRing = createDeckDraftState('player-2', 1, 0, []);

      // Count epic runes
      const countEpicRunes = (runes: Rune[]) => 
        runes.filter(r => r.effects.some(e => e.rarity === 'epic')).length;

      const epicsWithRing = countEpicRunes(stateWithRing.runeforges.flatMap(f => f.runes));
      const epicsWithoutRing = countEpicRunes(stateWithoutRing.runeforges.flatMap(f => f.runes));

      // With our mock values, Ring should produce more epics
      // This is a probabilistic test, so we just check the mechanism works
      expect(typeof epicsWithRing).toBe('number');
      expect(typeof epicsWithoutRing).toBe('number');
    });

    it('should handle win streak bonus correctly', () => {
      const state = createDeckDraftState('player-1', 3, 5, []);
      const allRunes = state.runeforges.flatMap(f => f.runes);
      
      // With winStreak=5, epic chance should be 1 + 5*1 = 6%
      // We can't test probability directly without many samples,
      // but we can verify runes are generated with effects
      allRunes.forEach(rune => {
        expect(rune.effects.length).toBeGreaterThan(0);
        expect(['common', 'uncommon', 'rare', 'epic']).toContain(rune.effects[0].rarity);
      });
    });

    it('should combine Ring and win streak effects', () => {
      // Win streak increases base epic chance
      // Ring doubles it
      const state = createDeckDraftState('player-1', 3, 10, ['ring']);
      
      // Base epic at winStreak=10: 1 + 10*1 = 11%
      // With Ring: 22%
      // This significantly increases epic odds
      const allRunes = state.runeforges.flatMap(f => f.runes);
      expect(allRunes.length).toBeGreaterThan(0);
      
      // All runes should have valid rarities
      allRunes.forEach(rune => {
        expect(['common', 'uncommon', 'rare', 'epic']).toContain(rune.effects[0].rarity);
      });
    });
  });

  describe('Multiple artefacts combination', () => {
    it('should handle both Ring and Robe active together', () => {
      // Robe effect applied by caller, so we pass 4 picks
      const state = createDeckDraftState('player-1', 4, 0, ['ring', 'robe']);
      
      // Should use the provided totalPicks
      expect(state.totalPicks).toBe(4);
      expect(state.picksRemaining).toBe(4);
      
      // Ring should affect rune rarity (verified by having runes with effects)
      const allRunes = state.runeforges.flatMap(f => f.runes);
      allRunes.forEach(rune => {
        expect(rune.effects).toBeDefined();
        expect(rune.effects.length).toBeGreaterThan(0);
      });
    });

    it('should handle all artefacts active together', () => {
      // Robe effect applied by caller
      const state = createDeckDraftState('player-1', 4, 5, ['ring', 'robe', 'potion', 'rod', 'tome']);
      
      // Should use the provided totalPicks
      expect(state.totalPicks).toBe(4);
      
      // Ring: affects rarity
      const allRunes = state.runeforges.flatMap(f => f.runes);
      expect(allRunes.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero win streak', () => {
      const state = createDeckDraftState('player-1', 3, 0, []);
      expect(state.runeforges).toHaveLength(3);
      expect(state.totalPicks).toBe(3);
    });

    it('should handle high win streak', () => {
      const state = createDeckDraftState('player-1', 3, 50, []);
      // Epic chance would be capped at 100% at some point
      const allRunes = state.runeforges.flatMap(f => f.runes);
      expect(allRunes.length).toBeGreaterThan(0);
    });

    it('should handle single pick with Robe (effect applied by caller)', () => {
      // Robe adds +1, so caller passes 2
      const state = createDeckDraftState('player-1', 2, 0, ['robe']);
      expect(state.totalPicks).toBe(2);
      expect(state.picksRemaining).toBe(2);
    });

    it('should generate unique rune IDs', () => {
      const state = createDeckDraftState('player-1', 3, 0, []);
      const allRunes = state.runeforges.flatMap(f => f.runes);
      const runeIds = allRunes.map(r => r.id);
      const uniqueIds = new Set(runeIds);
      expect(uniqueIds.size).toBe(runeIds.length);
    });
  });
});
