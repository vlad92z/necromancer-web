/**
 * Tests for the current solo encounter gameplay store.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { Rune, RuneType } from '../../types/game';
import { createEffectRef } from '../../utils/effectCatalog';
import { createEmptyWall, createEmptyWallCharges } from '../../utils/gameInitialization';
import { createRuneFromPool } from '../../utils/runeEffects';
import { useArtefactStore } from './artefactStore';
import { createGameplayStoreInstance } from './gameplayStore';

describe('gameplayStore current combat', () => {
  beforeEach(() => {
    useArtefactStore.setState({ arcaneDust: 0 });
  });

  it('starts a solo run with enemy, hand, draw deck, and no draft offers', () => {
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();

    const state = store.getState();
    expect(state.gameStarted).toBe(true);
    expect(state.enemy).toMatchObject({ id: 'goblin', health: 5, intent: { type: 'Attack', amount: 3 } });
    expect(state.combatPhase).toBe('player-turn');
    expect(state.hand).toHaveLength(6);
    expect(state.discardPile).toEqual([]);
    expect(state.deckDraftState).toBeNull();
  });

  it('selects a hand rune and completes a row-one wall slot', () => {
    const store = createGameplayStoreInstance();
    const fireRune = createTestRune('fire-1', 'Fire', 3);

    store.setState((state) => ({
      ...state,
      hand: [fireRune],
      selectedHandRuneId: null,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().selectHandRune(fireRune.id);
    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.hand).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
    expect(state.player.wall[0][0]).toMatchObject({ runeType: 'Fire', rarity: 'common' });
    expect(state.enemy?.health).toBe(7);
  });

  it('keeps selection active for invalid wall casts', () => {
    const store = createGameplayStoreInstance();
    const lifeRune = createTestRune('life-1', 'Life', 3);

    store.setState((state) => ({
      ...state,
      hand: [lifeRune],
      selectedHandRuneId: lifeRune.id,
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.hand).toEqual([lifeRune]);
    expect(state.selectedHandRuneId).toBe(lifeRune.id);
    expect(state.player.wall[0][0].runeType).toBeNull();
  });

  it('discards hand, applies enemy attack, and draws next hand on end turn', () => {
    const store = createGameplayStoreInstance();
    const hand = [createTestRune('hand-fire', 'Fire', 3)];
    const deck = [createTestRune('deck-fire', 'Fire', 3), createTestRune('deck-life', 'Life', 3)];

    store.setState((state) => ({
      ...state,
      hand,
      player: { ...state.player, deck, armor: 2, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(7);
    expect(state.player.armor).toBe(0);
    expect(state.hand.map((rune) => rune.id)).toEqual(['deck-fire', 'deck-life', 'hand-fire']);
    expect(state.discardPile).toEqual([]);
  });

  it('opens deck draft offers after lethal cast and starts the next encounter', () => {
    const store = createGameplayStoreInstance();
    const lethalRune = createTestRune('lethal-fire', 'Fire', 20);

    store.setState((state) => ({
      ...state,
      hand: [lethalRune],
      selectedHandRuneId: lethalRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 3, maxHealth: 3, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
      fullDeck: [lethalRune],
      player: { ...state.player, deck: [] },
    }));

    store.getState().castRuneToWall(0, 0);

    const victoryState = store.getState();
    expect(victoryState.combatPhase).toBe('victory');
    expect(victoryState.deckDraftState?.offers).toHaveLength(3);
    expect(victoryState.player.wall.flat().every((cell) => cell.runeType === null)).toBe(true);

    const offerId = victoryState.deckDraftState?.offers[0]?.id;
    expect(offerId).toBeDefined();
    store.getState().selectDeckDraftOffer(offerId as string);
    expect(store.getState().deckDraftReadyForNextGame).toBe(true);

    store.getState().startNextSoloGame();
    expect(store.getState().combatPhase).toBe('player-turn');
    expect(store.getState().deckDraftState).toBeNull();
    expect(store.getState().enemy?.maxHealth).toBe(6);
    expect(store.getState().enemy?.intent.amount).toBe(4);
    expect(store.getState().enemyMaxHealth).toBe(6);
    expect(store.getState().enemyAttackDamage).toBe(4);
  });

  it('adds fortune arcane dust through gameplay store casting', () => {
    const store = createGameplayStoreInstance();
    const windRune: Rune = {
      id: 'wind-fortune',
      runeType: 'Wind',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.fortune', { amount: 10 })],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand: [windRune],
      selectedHandRuneId: windRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().castRuneToWall(0, 2);

    expect(useArtefactStore.getState().arcaneDust).toBe(10);
  });

  it.each<[RuneType, number]>([
    ['Fire', 0],
    ['Life', 1],
    ['Wind', 2],
    ['Frost', 3],
    ['Void', 4],
    ['Lightning', 5],
  ])('increments %s rune sound signal after completing a matching row-one slot', (runeType, col) => {
    const store = createGameplayStoreInstance();
    const rune = createTestRune(`${runeType.toLowerCase()}-1`, runeType, 0);

    store.setState((state) => ({
      ...state,
      hand: [rune],
      selectedHandRuneId: rune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().castRuneToWall(0, col);

    expect(store.getState().runeSoundSignals[runeType]).toBe(1);
  });

  it('does not increment rune sound signal for non-final charges', () => {
    const store = createGameplayStoreInstance();
    const frostRune = createTestRune('frost-1', 'Frost', 0);

    store.setState((state) => ({
      ...state,
      hand: [frostRune],
      selectedHandRuneId: frostRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().castRuneToWall(1, 4);

    expect(store.getState().runeSoundSignals.Frost).toBe(0);
  });

  it('increments the casting rune sound signal for non-Frost armor gain', () => {
    const store = createGameplayStoreInstance();
    const armorRune: Rune = {
      id: 'fire-armor',
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.armor', { amount: 3 })],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand: [armorRune],
      selectedHandRuneId: armorRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.player.armor).toBe(3);
    expect(state.runeSoundSignals.Fire).toBe(1);
    expect(state.runeSoundSignals.Frost).toBe(0);
  });

  it('increments rune sound signal when a completed rune passive triggers', () => {
    const store = createGameplayStoreInstance();
    const wall = createEmptyWall();
    wall[0][3] = {
      runeType: 'Frost',
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorBoost', { amount: 5 })],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][3] = {
      ...wallCharges[0][3],
      currentCount: 1,
      completedRuneId: 'completed-frost',
    };
    const fireRune = createTestRune('fire-1', 'Fire', 0);

    store.setState((state) => ({
      ...state,
      hand: [fireRune],
      selectedHandRuneId: fireRune.id,
      player: { ...state.player, wall, armor: 0 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
    }));

    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.runeSoundSignals.Fire).toBe(1);
    expect(state.runeSoundSignals.Frost).toBe(1);
  });

  it('increments rune sound signal when a completed rune is retriggered', () => {
    const store = createGameplayStoreInstance();
    const wall = createEmptyWall();
    wall[0][3] = {
      runeType: 'Frost',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 2 })],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][3] = {
      ...wallCharges[0][3],
      currentCount: 1,
      completedRuneId: 'completed-frost',
    };
    const voidRune: Rune = {
      id: 'void-retrigger',
      runeType: 'Void',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.retriggerAdjacent')],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand: [voidRune],
      selectedHandRuneId: voidRune.id,
      player: { ...state.player, wall },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
    }));

    store.getState().castRuneToWall(0, 4);

    const state = store.getState();
    expect(state.enemy?.health).toBe(8);
    expect(state.runeSoundSignals.Void).toBe(1);
    expect(state.runeSoundSignals.Frost).toBe(1);
  });

  it('opens deck draft from lethal end-turn pulse before enemy attacks', () => {
    const store = createGameplayStoreInstance();
    const hand = [createTestRune('hand-fire', 'Fire', 3)];
    const wall = createEmptyWall();
    wall[0][0] = {
      runeType: 'Void',
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.pulseSynergy', { amount: 5, synergyType: 'Void' })],
    };
    wall[0][4] = {
      runeType: 'Void',
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand,
      player: { ...state.player, wall, health: 10, armor: 0, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 5, maxHealth: 5, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.combatPhase).toBe('victory');
    expect(state.deckDraftState?.offers).toHaveLength(3);
    expect(state.player.health).toBe(10);
  });

  it('deals uncommon Void pulse damage after completing a top-row slot', () => {
    const store = createGameplayStoreInstance();
    const voidRune = createRuneFromPool({ id: 'void-pulse', runeType: 'Void', rarity: 'uncommon' });

    store.setState((state) => ({
      ...state,
      hand: [voidRune],
      selectedHandRuneId: voidRune.id,
      player: { ...state.player, deck: [], armor: 0, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 0 } },
      wallCharges: createEmptyWallCharges(),
      discardPile: [],
    }));

    store.getState().castRuneToWall(0, 4);

    expect(store.getState().player.wall[0][4]).toMatchObject({ runeType: 'Void', rarity: 'uncommon' });
    expect(store.getState().enemy?.health).toBe(10);

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.enemy?.health).toBe(8);
    expect(state.combatPhase).toBe('player-turn');
  });

  it('resolves start-turn healing and drawing after normal refill', () => {
    const store = createGameplayStoreInstance();
    const wall = createEmptyWall();
    wall[0][0] = {
      runeType: 'Life',
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.healingStartTurn', { amount: 2 })],
    };
    wall[0][2] = {
      runeType: 'Wind',
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.drawingStartTurn', { amount: 1 })],
    };
    const deck = Array.from({ length: 7 }, (_, index) => createTestRune(`deck-${index}`, 'Fire', 1));

    store.setState((state) => ({
      ...state,
      hand: [createTestRune('hand-fire', 'Fire', 1)],
      player: { ...state.player, wall, deck, health: 5, maxHealth: 10, armor: 0 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30, intent: { type: 'Attack', amount: 0 } },
      discardPile: [],
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(7);
    expect(state.hand).toHaveLength(7);
    expect(state.player.deck).toEqual([]);
  });

  it('restores consumed adjacent runes on victory', () => {
    const store = createGameplayStoreInstance();
    const rareVoid = createRuneFromPool({ id: 'rare-void', runeType: 'Void', rarity: 'rare' });
    const wall = createEmptyWall();
    wall[0][3] = {
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][3] = {
      ...wallCharges[0][3],
      currentCount: 1,
      completedRuneId: 'adjacent-fire',
    };

    store.setState((state) => ({
      ...state,
      hand: [rareVoid],
      selectedHandRuneId: rareVoid.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
      suppressedRunes: [],
    }));

    store.getState().castRuneToWall(0, 4);

    const state = store.getState();
    expect(state.combatPhase).toBe('victory');
    expect(state.suppressedRunes).toEqual([]);
    expect(state.player.deck.map((rune) => rune.id)).toContain('adjacent-fire');
    expect(state.player.deck.map((rune) => rune.id)).toContain('rare-void');
  });

  it('returns adjacent completed runes to hand with epic Wind', () => {
    const store = createGameplayStoreInstance();
    const epicWind = createRuneFromPool({ id: 'epic-wind', runeType: 'Wind', rarity: 'epic' });
    const wall = createEmptyWall();
    wall[0][1] = {
      runeType: 'Life',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.healing', { amount: 2 })],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][1] = {
      ...wallCharges[0][1],
      currentCount: 1,
      completedRuneId: 'adjacent-life',
    };

    store.setState((state) => ({
      ...state,
      hand: [epicWind],
      selectedHandRuneId: epicWind.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
      suppressedRunes: [],
    }));

    store.getState().castRuneToWall(0, 2);

    const state = store.getState();
    expect(state.hand.map((rune) => rune.id)).toEqual(['adjacent-life']);
    expect(state.player.wall[0][1].runeType).toBeNull();
    expect(state.suppressedRunes).toEqual([]);
  });
});

function createTestRune(id: string, runeType: RuneType, damage: number): Rune {
  return {
    id,
    runeType,
    rarity: 'common',
    castEffectRefs: [createEffectRef('cast.damage', { amount: damage })],
    passiveEffectRefs: [],
  };
}
