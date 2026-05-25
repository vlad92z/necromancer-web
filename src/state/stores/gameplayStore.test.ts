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
    expect(state.enemy).toMatchObject({ id: 'goblin', health: 7, intent: { type: 'Attack', amount: 3 } });
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
    expect(state.enemyAttackSoundSignal).toBe(1);
    expect(state.hand.map((rune) => rune.id)).toEqual(['deck-fire', 'deck-life', 'hand-fire']);
    expect(state.discardPile).toEqual([]);
  });

  it('does not increment enemy attack sound signal when armor fully absorbs attack', () => {
    const store = createGameplayStoreInstance();

    store.setState((state) => ({
      ...state,
      hand: [],
      player: { ...state.player, deck: [], armor: 5, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(10);
    expect(state.player.armor).toBe(0);
    expect(state.enemyAttackSoundSignal).toBe(0);
    expect(state.shieldSoundSignal).toBe(1);
  });

  it('increments enemy attack sound signal when armor partially absorbs attack', () => {
    const store = createGameplayStoreInstance();

    store.setState((state) => ({
      ...state,
      hand: [],
      player: { ...state.player, deck: [], armor: 3, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(8);
    expect(state.player.armor).toBe(0);
    expect(state.enemyAttackSoundSignal).toBe(1);
    expect(state.shieldSoundSignal).toBe(0);
  });

  it('increments enemy attack sound signal for lethal enemy HP damage', () => {
    const store = createGameplayStoreInstance();

    store.setState((state) => ({
      ...state,
      hand: [],
      player: { ...state.player, deck: [], armor: 0, health: 4 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.combatPhase).toBe('defeat');
    expect(state.player.health).toBe(0);
    expect(state.enemyAttackSoundSignal).toBe(1);
    expect(state.shieldSoundSignal).toBe(0);
  });

  it('increments shield sound signal when passives reduce attack to zero', () => {
    const store = createGameplayStoreInstance();
    const wall = createEmptyWall();
    wall[0][3] = {
      id: 'completed-frost',
      runeType: 'Frost',
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.reduceDamage', { amount: 5 })],
    };

    store.setState((state) => ({
      ...state,
      hand: [],
      player: { ...state.player, wall, deck: [], armor: 0, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(10);
    expect(state.enemyAttackSoundSignal).toBe(0);
    expect(state.shieldSoundSignal).toBe(1);
  });

  it('opens rune pack offers after lethal cast, selects a pack, and starts the next encounter', () => {
    const store = createGameplayStoreInstance();
    const lethalRune = createTestRune('lethal-fire', 'Fire', 20);
    const baseDeckRune = createTestRune('base-life', 'Life', 2);
    const encounterDeckRune = createTestRune('encounter-wind', 'Wind', 2);
    const encounterDiscardRune = createTestRune('encounter-frost', 'Frost', 2);
    const suppressedRune = createTestRune('suppressed-void', 'Void', 2);

    store.setState((state) => ({
      ...state,
      hand: [lethalRune],
      discardPile: [encounterDiscardRune],
      suppressedRunes: [suppressedRune],
      selectedHandRuneId: lethalRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 3, maxHealth: 3, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
      fullDeck: [lethalRune, baseDeckRune],
      player: { ...state.player, deck: [encounterDeckRune] },
    }));

    store.getState().castRuneToWall(0, 0);

    const victoryState = store.getState();
    expect(victoryState.combatPhase).toBe('victory');
    expect(victoryState.deckDraftState?.offers).toHaveLength(6);
    expect(victoryState.deckDraftState?.offers.map((offer) => offer.runeType)).toEqual([
      'Fire',
      'Life',
      'Wind',
      'Frost',
      'Void',
      'Lightning',
    ]);
    expect(victoryState.player.wall.flat().every((cell) => cell.runeType === null)).toBe(true);
    expect(victoryState.hand).toEqual([]);
    expect(victoryState.discardPile).toEqual([]);
    expect(victoryState.suppressedRunes).toEqual([]);

    const fireOffer = victoryState.deckDraftState?.offers[0];
    expect(fireOffer?.runeType).toBe('Fire');
    const encounterDeckBeforeSelection = victoryState.player.deck;
    const fullDeckBeforeSelection = victoryState.fullDeck;
    store.getState().selectDeckDraftOffer(fireOffer?.id as string);

    const selectedState = store.getState();
    expect(selectedState.deckDraftReadyForNextGame).toBe(true);
    expect(selectedState.deckDraftState?.selectedOffer?.id).toBe(fireOffer?.id);
    expect(selectedState.player.deck).toEqual(encounterDeckBeforeSelection);
    expect(selectedState.fullDeck).toHaveLength(fullDeckBeforeSelection.length + 3);
    expect(selectedState.fullDeck.slice(-3).every((rune) => rune.runeType === 'Fire')).toBe(true);

    store.getState().startNextSoloGame();
    const nextState = store.getState();
    expect(nextState.combatPhase).toBe('player-turn');
    expect(nextState.deckDraftState).toBeNull();
    expect(nextState.enemy?.maxHealth).toBe(10);
    expect(nextState.enemy?.intent.amount).toBe(5);
    expect(nextState.enemyMaxHealth).toBe(10);
    expect(nextState.enemyAttackDamage).toBe(5);
    expect(nextState.suppressedRunes).toEqual([]);
    expect(nextState.discardPile).toEqual([]);
    expect(nextState.wallCharges.flat().every((charge) => charge.stagedRune === null && charge.spentRunes.length === 0)).toBe(true);
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id).sort()).toEqual(
      selectedState.fullDeck.map((rune) => rune.id).sort()
    );
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id)).not.toContain(encounterDeckRune.id);
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id)).not.toContain(encounterDiscardRune.id);
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id)).not.toContain(suppressedRune.id);
  });

  it('starts the next encounter from victory without selecting a pack', () => {
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
    const deckSizeBeforeSkip = victoryState.fullDeck.length;
    expect(victoryState.deckDraftState?.selectedOffer).toBeNull();

    store.getState().startNextSoloGame();

    const nextState = store.getState();
    expect(nextState.combatPhase).toBe('player-turn');
    expect(nextState.deckDraftState).toBeNull();
    expect(nextState.fullDeck).toHaveLength(deckSizeBeforeSkip);
  });

  it('does not apply old draft bonuses or Ring/Robe draft passives to packs', () => {
    const store = createGameplayStoreInstance();
    const lethalRune = createTestRune('lethal-fire', 'Fire', 20);

    store.setState((state) => ({
      ...state,
      activeArtefacts: ['ring', 'robe'],
      hand: [lethalRune],
      selectedHandRuneId: lethalRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 3, maxHealth: 3, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
      fullDeck: [lethalRune],
      player: { ...state.player, deck: [], health: 4, maxHealth: 10 },
    }));

    store.getState().castRuneToWall(0, 0);

    const victoryState = store.getState();
    expect(victoryState.deckDraftState?.offers).toHaveLength(6);
    expect(victoryState.deckDraftState?.picksRemaining).toBe(1);

    const offerId = victoryState.deckDraftState?.offers[0]?.id;
    store.getState().selectDeckDraftOffer(offerId as string);

    const selectedState = store.getState();
    expect(selectedState.player.health).toBe(4);
    expect(selectedState.player.maxHealth).toBe(10);
    expect(selectedState.player.deck).toEqual(victoryState.player.deck);
    expect(selectedState.fullDeck).toHaveLength(victoryState.fullDeck.length + 3);
    expect(selectedState.deckDraftState?.picksRemaining).toBe(0);
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

    store.getState().castRuneToWall(0, 1);

    expect(useArtefactStore.getState().arcaneDust).toBe(10);
  });

  it.each<[RuneType, number]>([
    ['Fire', 0],
    ['Life', 2],
    ['Wind', 1],
    ['Frost', 2],
    ['Void', 0],
    ['Lightning', 1],
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
    const frostRune = createTestRune('frost-1', 'Frost', 0, 'uncommon');

    store.setState((state) => ({
      ...state,
      hand: [frostRune],
      selectedHandRuneId: frostRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 5 } },
      wallCharges: createEmptyWallCharges(),
    }));

    store.getState().castRuneToWall(1, 4);

    expect(store.getState().runeSoundSignals.Frost).toBe(0);
    expect(store.getState().wallChargeSoundSignal).toBe(1);
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
      id: 'completed-frost',
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
    wall[0][1] = {
      id: 'completed-frost',
      runeType: 'Frost',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 2 })],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][1] = {
      ...wallCharges[0][1],
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

    store.getState().castRuneToWall(0, 0);

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
      id: 'completed-void-pulse',
      runeType: 'Void',
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.pulseSynergy', { amount: 5, synergyType: 'Void' })],
    };
    wall[0][4] = {
      id: 'completed-void-support',
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
    expect(state.deckDraftState?.offers).toHaveLength(6);
    expect(state.player.health).toBe(10);
  });

  it('deals rare Void pulse damage after completing a top-row slot', () => {
    const store = createGameplayStoreInstance();
    const voidRune = createRuneFromPool({ id: 'void-pulse', runeType: 'Void', rarity: 'rare' });
    const chargeOne = createTestRune('void-charge-1', 'Void', 0);
    const chargeTwo = createTestRune('void-charge-2', 'Void', 0);

    store.setState((state) => ({
      ...state,
      hand: [voidRune, chargeOne, chargeTwo],
      selectedHandRuneId: voidRune.id,
      player: { ...state.player, deck: [], armor: 0, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10, intent: { type: 'Attack', amount: 0 } },
      wallCharges: createEmptyWallCharges(),
      discardPile: [],
    }));

    store.getState().castRuneToWall(0, 0);
    expect(store.getState().player.wall[0][0].runeType).toBeNull();
    store.getState().selectHandRune(chargeOne.id);
    store.getState().castRuneToWall(0, 0);
    expect(store.getState().player.wall[0][0].runeType).toBeNull();
    store.getState().selectHandRune(chargeTwo.id);
    store.getState().castRuneToWall(0, 0);

    expect(store.getState().player.wall[0][0]).toMatchObject({ runeType: 'Void', rarity: 'rare' });
    expect(store.getState().enemy?.health).toBe(10);

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.enemy?.health).toBe(9);
    expect(state.combatPhase).toBe('player-turn');
  });

  it('resolves start-turn healing and drawing after normal refill', () => {
    const store = createGameplayStoreInstance();
    const wall = createEmptyWall();
    wall[0][0] = {
      id: 'completed-life-start',
      runeType: 'Life',
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.healingStartTurn', { amount: 2 })],
    };
    wall[0][2] = {
      id: 'completed-wind-start',
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

  it('does not persist consumed adjacent runes across victory', () => {
    const store = createGameplayStoreInstance();
    const uncommonVoid = createRuneFromPool({ id: 'uncommon-void', runeType: 'Void', rarity: 'uncommon' });
    const chargeVoid = createTestRune('charge-void', 'Void', 0);
    const wall = createEmptyWall();
    wall[0][1] = {
      id: 'adjacent-fire',
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][1] = {
      ...wallCharges[0][1],
      currentCount: 1,
      completedRuneId: 'adjacent-fire',
    };

    store.setState((state) => ({
      ...state,
      hand: [uncommonVoid, chargeVoid],
      selectedHandRuneId: uncommonVoid.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 2, maxHealth: 2, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
      suppressedRunes: [],
    }));

    store.getState().castRuneToWall(0, 0);
    store.getState().selectHandRune(chargeVoid.id);
    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.combatPhase).toBe('victory');
    expect(state.hand).toEqual([]);
    expect(state.suppressedRunes).toEqual([]);
    expect(state.player.deck.map((rune) => rune.id)).not.toContain('adjacent-fire');
    expect(state.player.deck.map((rune) => rune.id)).not.toContain('uncommon-void');

    store.getState().startNextSoloGame();

    const nextState = store.getState();
    const nextEncounterRuneIds = [...nextState.hand, ...nextState.player.deck].map((rune) => rune.id);
    expect(nextEncounterRuneIds).not.toContain('adjacent-fire');
    expect(nextEncounterRuneIds).not.toContain('uncommon-void');
  });

  it('returns adjacent completed runes to hand with epic Wind', () => {
    const store = createGameplayStoreInstance();
    const epicWind = createRuneFromPool({ id: 'epic-wind', runeType: 'Wind', rarity: 'epic' });
    const chargeOne = createTestRune('wind-charge-1', 'Wind', 0);
    const chargeTwo = createTestRune('wind-charge-2', 'Wind', 0);
    const chargeThree = createTestRune('wind-charge-3', 'Wind', 0);
    const wall = createEmptyWall();
    wall[0][2] = {
      id: 'adjacent-life',
      runeType: 'Life',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.healing', { amount: 2 })],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][2] = {
      ...wallCharges[0][2],
      currentCount: 1,
      completedRuneId: 'adjacent-life',
    };

    store.setState((state) => ({
      ...state,
      hand: [epicWind, chargeOne, chargeTwo, chargeThree],
      selectedHandRuneId: epicWind.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
      suppressedRunes: [],
    }));

    store.getState().castRuneToWall(0, 1);
    store.getState().selectHandRune(chargeOne.id);
    store.getState().castRuneToWall(0, 1);
    store.getState().selectHandRune(chargeTwo.id);
    store.getState().castRuneToWall(0, 1);
    store.getState().selectHandRune(chargeThree.id);
    store.getState().castRuneToWall(0, 1);

    const state = store.getState();
    expect(state.hand).toHaveLength(1);
    expect(state.hand[0]?.runeType).toBe('Life');
    expect(state.hand[0]?.id).not.toBe('adjacent-life');
    expect(state.player.wall[0][2].runeType).toBeNull();
    expect(state.suppressedRunes).toEqual([]);
  });

  it('sends returned overflow to discard when hand is already at cap after cast completion', () => {
    const store = createGameplayStoreInstance();
    const epicWind = createRuneFromPool({ id: 'epic-wind-overflow', runeType: 'Wind', rarity: 'epic' });
    const chargeOne = createTestRune('wind-overflow-charge-1', 'Wind', 0);
    const chargeTwo = createTestRune('wind-overflow-charge-2', 'Wind', 0);
    const chargeThree = createTestRune('wind-overflow-charge-3', 'Wind', 0);
    const fillerHand = Array.from({ length: 9 }, (_, index) => createTestRune(`filler-${index}`, 'Fire', 0));
    const wall = createEmptyWall();
    wall[0][2] = {
      id: 'adjacent-life-overflow',
      runeType: 'Life',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.healing', { amount: 2 })],
      passiveEffectRefs: [],
    };
    wall[1][2] = {
      id: 'adjacent-fire-overflow',
      runeType: 'Fire',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][2] = {
      ...wallCharges[0][2],
      currentCount: 1,
      completedRuneId: 'adjacent-life-overflow',
    };
    wallCharges[1][2] = {
      ...wallCharges[1][2],
      currentCount: 1,
      completedRuneId: 'adjacent-fire-overflow',
    };

    store.setState((state) => ({
      ...state,
      hand: [epicWind, chargeOne, chargeTwo, chargeThree, ...fillerHand],
      selectedHandRuneId: epicWind.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
      suppressedRunes: [],
      discardPile: [],
    }));

    store.getState().castRuneToWall(0, 1);
    store.getState().selectHandRune(chargeOne.id);
    store.getState().castRuneToWall(0, 1);
    store.getState().selectHandRune(chargeTwo.id);
    store.getState().castRuneToWall(0, 1);
    store.getState().selectHandRune(chargeThree.id);
    store.getState().castRuneToWall(0, 1);

    const state = store.getState();
    expect(state.hand).toHaveLength(10);
    expect(state.hand.some((rune) => rune.runeType === 'Life' || rune.runeType === 'Fire')).toBe(true);
    expect(state.discardPile.some((rune) => rune.runeType === 'Life' || rune.runeType === 'Fire')).toBe(true);
    expect(state.player.wall[0][2].runeType).toBeNull();
    expect(state.player.wall[1][2].runeType).toBeNull();
  });

  it('opens victory immediately when virtual charge completion deals lethal damage', () => {
    const store = createGameplayStoreInstance();
    const chargerRune: Rune = {
      id: 'charger-rune',
      runeType: 'Wind',
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.chargeAdjacent')],
      passiveEffectRefs: [],
    };
    const wallCharges = createEmptyWallCharges();
    wallCharges[0][0] = {
      ...wallCharges[0][0],
      currentCount: 1,
      requiredCount: 2,
      stagedRune: {
        id: 'staged-fire-lethal',
        runeType: 'Fire',
        rarity: 'uncommon',
        castEffectRefs: [createEffectRef('cast.damage', { amount: 5 })],
        passiveEffectRefs: [],
      },
      spentRunes: [createTestRune('spent-fire-lethal', 'Fire', 0)],
      lockedRuneType: 'Fire',
      completedRuneId: null,
    };

    store.setState((state) => ({
      ...state,
      hand: [chargerRune],
      selectedHandRuneId: chargerRune.id,
      player: { ...state.player, deck: [], health: 10, maxHealth: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 5, maxHealth: 5, intent: { type: 'Attack', amount: 5 } },
      wallCharges,
      discardPile: [],
    }));

    store.getState().castRuneToWall(0, 1);

    const state = store.getState();
    expect(state.combatPhase).toBe('victory');
    expect(state.enemy?.health).toBe(0);
    expect(state.player.health).toBe(10);
    expect(state.enemyAttackSoundSignal).toBe(0);
    expect(state.discardPile).toEqual([]);
    expect(state.deckDraftState?.offers).toHaveLength(6);
  });
});

function createTestRune(id: string, runeType: RuneType, damage: number, rarity: Rune['rarity'] = 'common'): Rune {
  return {
    id,
    runeType,
    rarity,
    castEffectRefs: [createEffectRef('cast.damage', { amount: damage })],
    passiveEffectRefs: [],
  };
}
