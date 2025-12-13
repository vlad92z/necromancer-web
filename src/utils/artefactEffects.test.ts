/**
 * Unit tests for artefact effects
 */

import { describe, it, expect } from 'vitest';
import {
  getActiveArtefacts,
  hasArtefact,
  modifyDraftRarityWithRing,
  getDeckDraftSelectionLimit,
  modifyOutgoingDamageWithPotion,
  modifyIncomingDamageWithPotion,
  getDamageToScoreBonusWithRod,
  modifySegmentResultWithTome,
  applyOutgoingDamageModifiers,
  applyOutgoingHealingModifiers,
  applyIncomingDamageModifiers,
  getArmorGainMultiplier,
  getArtefactEffectDescription,
} from './artefactEffects';
import { initializeSoloGame } from './gameInitialization';
import type { ArtefactId } from '../types/artefacts';

describe('artefactEffects', () => {
  describe('getActiveArtefacts', () => {
    it('should return empty array when no artefacts are active', () => {
      const state = initializeSoloGame();
      expect(getActiveArtefacts(state)).toEqual([]);
    });

    it('should return active artefacts from state', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['ring', 'rod'] as ArtefactId[] };
      expect(getActiveArtefacts(state)).toEqual(['ring', 'rod']);
    });
  });

  describe('hasArtefact', () => {
    it('should return false when artefact is not active', () => {
      const state = initializeSoloGame();
      expect(hasArtefact(state, 'ring')).toBe(false);
    });

    it('should return true when artefact is active', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['ring', 'rod'] as ArtefactId[] };
      expect(hasArtefact(state, 'ring')).toBe(true);
      expect(hasArtefact(state, 'rod')).toBe(true);
    });

    it('should return false for artefact not in active list', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['ring'] as ArtefactId[] };
      expect(hasArtefact(state, 'potion')).toBe(false);
    });
  });

  describe('Ring effect - modifyDraftRarityWithRing', () => {
    it('should not modify probabilities when Ring is not active', () => {
      const result = modifyDraftRarityWithRing(10, 20, false);
      expect(result.epicChance).toBe(10);
      expect(result.rareChance).toBe(20);
      expect(result.uncommonChance).toBe(70);
    });

    it('should double epic chance when Ring is active', () => {
      const result = modifyDraftRarityWithRing(10, 20, true);
      expect(result.epicChance).toBe(20);
      // Rare and uncommon should share remaining 80%
      expect(result.rareChance + result.uncommonChance).toBeCloseTo(80);
    });

    it('should cap epic chance at 100%', () => {
      const result = modifyDraftRarityWithRing(60, 20, true);
      expect(result.epicChance).toBe(100);
      expect(result.rareChance).toBe(0);
      expect(result.uncommonChance).toBe(0);
    });

    it('should maintain proportional distribution of remaining probabilities', () => {
      const result = modifyDraftRarityWithRing(10, 30, true);
      expect(result.epicChance).toBe(20);
      const remainingTotal = result.rareChance + result.uncommonChance;
      expect(remainingTotal).toBeCloseTo(80);
      // Original rare was 30/90 = 1/3 of non-epic, should still be ~1/3
      const rareProportion = result.rareChance / remainingTotal;
      expect(rareProportion).toBeCloseTo(30 / 90, 1);
    });
  });

  describe('deck draft selection limit', () => {
    it('defaults to one runeforge when no artefacts are active', () => {
      expect(getDeckDraftSelectionLimit([])).toBe(1);
    });

    it('allows selecting two runeforges when Robe is active', () => {
      expect(getDeckDraftSelectionLimit(['robe'] as ArtefactId[])).toBe(2);
    });

    it('never exceeds the maximum runeforge selection cap', () => {
      const artefacts = ['robe', 'rod', 'ring', 'potion', 'tome'] as ArtefactId[];
      expect(getDeckDraftSelectionLimit(artefacts)).toBeLessThanOrEqual(3);
    });
  });

  describe('Potion effect - damage modifiers', () => {
    it('should not modify outgoing damage when Potion is not active', () => {
      expect(modifyOutgoingDamageWithPotion(10, false)).toBe(10);
      expect(modifyOutgoingDamageWithPotion(25, false)).toBe(25);
    });

    it('should double outgoing damage when Potion is active', () => {
      expect(modifyOutgoingDamageWithPotion(10, true)).toBe(20);
      expect(modifyOutgoingDamageWithPotion(25, true)).toBe(50);
    });

    it('should not modify incoming damage when Potion is not active', () => {
      expect(modifyIncomingDamageWithPotion(10, false)).toBe(10);
      expect(modifyIncomingDamageWithPotion(15, false)).toBe(15);
    });

    it('should triple incoming damage when Potion is active', () => {
      expect(modifyIncomingDamageWithPotion(10, true)).toBe(30);
      expect(modifyIncomingDamageWithPotion(15, true)).toBe(45);
    });
  });

  describe('Rod effect - getDamageToScoreBonusWithRod', () => {
    it('should return 0 when Rod is not active', () => {
      expect(getDamageToScoreBonusWithRod(10, false)).toBe(0);
      expect(getDamageToScoreBonusWithRod(25, false)).toBe(0);
    });

    it('should return damage amount as score bonus when Rod is active', () => {
      expect(getDamageToScoreBonusWithRod(10, true)).toBe(10);
      expect(getDamageToScoreBonusWithRod(25, true)).toBe(25);
    });
  });

  describe('Tome effect - modifySegmentResultWithTome', () => {
    it('should not modify segment when Tome is not active', () => {
      const segment = {
        segmentSize: 1,
        damage: 10,
        healing: 5,
        armor: 3,
        arcaneDust: 0,
        orderedCells: [],
        resolutionSteps: [],
        channelSynergyTriggered: false,
      };
      const result = modifySegmentResultWithTome(segment, false);
      expect(result.damage).toBe(10);
      expect(result.healing).toBe(5);
      expect(result.armor).toBe(3);
    });

    it('should multiply damage and healing by 10 for size-1 segments when Tome is active', () => {
      const segment = {
        segmentSize: 1,
        damage: 10,
        healing: 5,
        armor: 4,
        arcaneDust: 0,
        orderedCells: [],
        resolutionSteps: [],
        channelSynergyTriggered: false,
      };
      const result = modifySegmentResultWithTome(segment, true);
      expect(result.damage).toBe(100);
      expect(result.healing).toBe(50);
      expect(result.armor).toBe(40);
    });

    it('should not modify segments larger than 1 even when Tome is active', () => {
      const segment = {
        segmentSize: 2,
        damage: 10,
        healing: 5,
        armor: 2,
        arcaneDust: 0,
        orderedCells: [],
        resolutionSteps: [],
        channelSynergyTriggered: false,
      };
      const result = modifySegmentResultWithTome(segment, true);
      expect(result.damage).toBe(10);
      expect(result.healing).toBe(5);
      expect(result.armor).toBe(2);
    });

    it('should not modify size-3 segment when Tome is active', () => {
      const segment = {
        segmentSize: 3,
        damage: 15,
        healing: 8,
        armor: 1,
        arcaneDust: 0,
        orderedCells: [],
        resolutionSteps: [],
        channelSynergyTriggered: false,
      };
      const result = modifySegmentResultWithTome(segment, true);
      expect(result.damage).toBe(15);
      expect(result.healing).toBe(8);
      expect(result.armor).toBe(1);
    });
  });

  describe('applyOutgoingDamageModifiers - combined effects', () => {
    it('should apply no modifiers when no artefacts are active', () => {
      const state = initializeSoloGame();
      expect(applyOutgoingDamageModifiers(10, 2, state)).toBe(10);
    });

    it('should apply Tome (10x) for size-1 segments', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome'] as ArtefactId[] };
      expect(applyOutgoingDamageModifiers(10, 1, state)).toBe(100);
    });

    it('should not apply Tome for size-2 segments', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome'] as ArtefactId[] };
      expect(applyOutgoingDamageModifiers(10, 2, state)).toBe(10);
    });

    it('should apply Potion (2x) for any segment size', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['potion'] as ArtefactId[] };
      expect(applyOutgoingDamageModifiers(10, 2, state)).toBe(20);
    });

    it('should apply both Tome and Potion for size-1 segments (10x then 2x = 20x)', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome', 'potion'] as ArtefactId[] };
      expect(applyOutgoingDamageModifiers(10, 1, state)).toBe(200);
    });

    it('should apply only Potion for size-2 segments when both active', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome', 'potion'] as ArtefactId[] };
      expect(applyOutgoingDamageModifiers(10, 2, state)).toBe(20);
    });
  });

  describe('applyOutgoingHealingModifiers', () => {
    it('should apply no modifiers when no artefacts are active', () => {
      const state = initializeSoloGame();
      expect(applyOutgoingHealingModifiers(5, 2, state)).toBe(5);
    });

    it('should apply Tome (10x) for size-1 segments', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome'] as ArtefactId[] };
      expect(applyOutgoingHealingModifiers(5, 1, state)).toBe(50);
    });

    it('should not apply Tome for size-2 segments', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome'] as ArtefactId[] };
      expect(applyOutgoingHealingModifiers(5, 2, state)).toBe(5);
    });

    it('should not apply Potion to healing', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['potion'] as ArtefactId[] };
      expect(applyOutgoingHealingModifiers(5, 2, state)).toBe(5);
    });

    it('should double healing when Rod is active', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['rod'] as ArtefactId[] };
      expect(applyOutgoingHealingModifiers(5, 2, state)).toBe(10);
    });
  });

  describe('getArmorGainMultiplier', () => {
    it('should return 1 when no artefacts are active', () => {
      const state = initializeSoloGame();
      expect(getArmorGainMultiplier(2, state)).toBe(1);
    });

    it('should double armor when Potion is active', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['potion'] as ArtefactId[] };
      expect(getArmorGainMultiplier(2, state)).toBe(2);
    });

    it('should apply Tome (10x) for size-1 segments', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome'] as ArtefactId[] };
      expect(getArmorGainMultiplier(1, state)).toBe(10);
    });

    it('should stack Tome and Potion multipliers', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['tome', 'potion'] as ArtefactId[] };
      expect(getArmorGainMultiplier(1, state)).toBe(20);
    });

    it('should include Rod healing bonus', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['rod'] as ArtefactId[] };
      expect(getArmorGainMultiplier(2, state)).toBe(2);
    });
  });

  describe('applyIncomingDamageModifiers - combined effects', () => {
    it('should apply no modifiers when no artefacts are active', () => {
      const state = initializeSoloGame();
      const result = applyIncomingDamageModifiers(10, state);
      expect(result.damage).toBe(10);
      expect(result.scoreBonus).toBe(0);
    });

    it('should apply Potion (3x) to incoming damage', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['potion'] as ArtefactId[] };
      const result = applyIncomingDamageModifiers(10, state);
      expect(result.damage).toBe(30);
      expect(result.scoreBonus).toBe(0);
    });

    it('should apply Rod to convert damage to score', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['rod'] as ArtefactId[] };
      const result = applyIncomingDamageModifiers(10, state);
      expect(result.damage).toBe(10);
      expect(result.scoreBonus).toBe(10);
    });

    it('should apply both Potion and Rod (Rod uses post-Potion damage)', () => {
      const state = { ...initializeSoloGame(), activeArtefacts: ['potion', 'rod'] as ArtefactId[] };
      const result = applyIncomingDamageModifiers(10, state);
      expect(result.damage).toBe(30); // 10 * 3 from Potion
      expect(result.scoreBonus).toBe(30); // Rod uses the 30 damage
    });
  });

  describe('getArtefactEffectDescription', () => {
    it('should return description for Ring', () => {
      const desc = getArtefactEffectDescription('ring');
      expect(desc).toContain('Double');
      expect(desc).toContain('epic');
    });

    it('should return description for Rod', () => {
      const desc = getArtefactEffectDescription('rod');
      expect(desc).toContain('damage taken');
      expect(desc).toContain('Rune Score');
      expect(desc).toContain('healing');
    });

    it('should return description for Potion', () => {
      const desc = getArtefactEffectDescription('potion');
      expect(desc).toContain('Double');
      expect(desc).toContain('triple');
      expect(desc).toContain('armor');
    });

    it('should return description for Robe', () => {
      const desc = getArtefactEffectDescription('robe');
      expect(desc).toContain('picks');
      expect(desc).toContain('1');
    });

    it('should return description for Tome', () => {
      const desc = getArtefactEffectDescription('tome');
      expect(desc).toContain('size 1');
      expect(desc).toContain('10×');
      expect(desc).toContain('armor');
    });
  });
});
