/**
 * Tests for the current solo encounter gameplay store.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Rune, RuneType } from '../../types/game';
import { createEffectRef } from '../../utils/effectCatalog';
import { createEmptyWall, createMonsterEnemy } from '../../utils/gameInitialization';
import { MONSTER_CATALOG } from '../../utils/monsterCatalog';
import { createRuneFromPool } from '../../utils/runeEffects';
import { completeActiveMapEncounter, travelOnSoloMap } from '../../utils/soloMap';
import { getRegionDefinition } from '../../utils/regionCatalog';
import { createRuneRemovalEffectRef } from '../../utils/runeRemoval';
import { createGameplayStoreInstance } from './gameplayStore';

type GameplayStoreInstance = ReturnType<typeof createGameplayStoreInstance>;

function startEncounterAtA(store: GameplayStoreInstance): void {
  store.getState().startSoloRun();
  store.setState((state) => ({
    ...state,
    soloMap: {
      ...state.soloMap,
      availableEventTokenIds: getRegionDefinition('greenwood').eventTokens
        .filter((token) => token.kind === 'combat')
        .map((token) => token.id),
    },
  }));
  store.getState().travelToMapTarget({
    kind: 'road',
    tileKey: '0,0',
    roadId: 'right-75',
  });
}

describe('gameplayStore current combat', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
  });

  it('starts a solo run on the map with the combat state ready for a future encounter', () => {
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();

    const state = store.getState();
    expect(state.gameStarted).toBe(true);
    expect(state.soloPhase).toBe('map');
    expect(state.soloMap.playerPosition).toEqual({ tileKey: '0,0', locationId: 'start' });
    expect(Object.keys(state.soloMap.tiles)).toEqual(['0,0']);
    expect(state.enemy).toBeNull();
    expect(state.combatPhase).toBe('player-turn');
    expect(state.hand).toEqual([]);
    expect(state.player.deck).toHaveLength(state.fullDeck.length);
    expect(state.discardPile).toEqual([]);
    expect(state.deckDraftState).toBeNull();
  });

  it('resets Arcane Dust when a new adventure starts', () => {
    const store = createGameplayStoreInstance();
    store.setState((state) => ({ ...state, arcaneDust: 19 }));

    store.getState().startSoloRun();

    expect(store.getState().arcaneDust).toBe(0);
  });

  it('travels to an uncleared location and launches a fresh Goblin encounter', () => {
    const store = createGameplayStoreInstance();
    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      player: { ...state.player, health: 73, armor: 12 },
      soloMap: {
        ...state.soloMap,
        availableEventTokenIds: getRegionDefinition('greenwood').eventTokens
          .filter((token) => token.kind === 'combat')
          .map((token) => token.id),
      },
    }));

    store.getState().travelToMapTarget({
      kind: 'road',
      tileKey: '0,0',
      roadId: 'right-75',
    });

    const state = store.getState();
    expect(state.soloPhase).toBe('encounter');
    expect(state.soloMap.playerPosition).toEqual({ tileKey: '1,0', locationId: 'A' });
    expect(state.soloMap.tiles['1,0'].events.A?.cleared).toBe(false);
    expect(state.soloMap.activeEncounter).toMatchObject({ tileKey: '1,0', locationId: 'A' });
    expect(state.enemy).toMatchObject({
      id: 'goblin',
      health: MONSTER_CATALOG.goblin.maxHealth,
      maxHealth: MONSTER_CATALOG.goblin.maxHealth,
    });
    expect(state.hand).toHaveLength(5);
    expect(state.player.health).toBe(73);
    expect(state.player.armor).toBe(0);
  });

  it('launches Golem Lord with its boss metadata and Life-only board', () => {
    const store = createGameplayStoreInstance();
    store.getState().startSoloRun();
    const tile = {
      key: '1,0',
      x: 1,
      y: 0,
      kind: 'forest' as const,
      events: {
        A: {
          id: '1,0:A',
          locationId: 'A' as const,
          tokenId: null,
          kind: 'empty' as const,
          cleared: true,
        },
        B: {
          id: '1,0:B',
          locationId: 'B' as const,
          tokenId: null,
          kind: 'boss' as const,
          monsterId: 'golem-lord' as const,
          cleared: false,
        },
      },
    };
    store.setState((state) => ({
      ...state,
      soloMap: {
        ...state.soloMap,
        tiles: { ...state.soloMap.tiles, [tile.key]: tile },
        playerPosition: { tileKey: tile.key, locationId: 'A' },
      },
    }));

    store.getState().travelToMapTarget({ kind: 'location', tileKey: tile.key, locationId: 'B' });

    const state = store.getState();
    expect(state.enemy).toMatchObject({
      id: 'golem-lord',
      name: 'Golem Lord',
      isBoss: true,
      health: 50,
      maxHealth: 50,
      imageSrc: expect.stringContaining('golem.png'),
    });
    expect(state.enemyBoard.flat().every((cell) => cell.runeTypes.length === 0)).toBe(true);
  });

  it('heals 25% of max health and visits a Healing Shrine immediately', () => {
    const store = createGameplayStoreInstance();
    store.getState().startSoloRun();
    const shrineToken = getRegionDefinition('greenwood').eventTokens.find((token) => token.kind === 'healing');
    store.setState((state) => ({
      ...state,
      player: { ...state.player, health: 50, maxHealth: 100 },
      soloMap: { ...state.soloMap, availableEventTokenIds: [shrineToken!.id] },
    }));

    store.getState().travelToMapTarget({ kind: 'road', tileKey: '0,0', roadId: 'right-75' });

    const state = store.getState();
    expect(state.soloPhase).toBe('map');
    expect(state.player.health).toBe(75);
    expect(state.soloMap.tiles['1,0'].events.A).toMatchObject({ kind: 'healing', cleared: true });
  });

  it('reveals a road tile before resolving its arrival event', () => {
    const store = createGameplayStoreInstance();
    store.getState().startSoloRun();
    const shrineToken = getRegionDefinition('greenwood').eventTokens.find((token) => token.kind === 'healing');
    store.setState((state) => ({
      ...state,
      player: { ...state.player, health: 50, maxHealth: 100 },
      soloMap: { ...state.soloMap, availableEventTokenIds: [shrineToken!.id] },
    }));

    const arrivalTarget = store.getState().revealMapRoadTarget({
      kind: 'road',
      tileKey: '0,0',
      roadId: 'right-75',
    });

    expect(arrivalTarget).toEqual({ kind: 'location', tileKey: '1,0', locationId: 'A' });
    expect(store.getState().soloPhase).toBe('map');
    expect(store.getState().player.health).toBe(50);
    expect(store.getState().soloMap.playerPosition).toEqual({ tileKey: '0,0', locationId: 'start' });
    expect(store.getState().soloMap.tiles['1,0'].events.A).toMatchObject({ kind: 'healing', cleared: false });

    store.getState().travelToMapTarget(arrivalTarget!);

    expect(store.getState().player.health).toBe(75);
    expect(store.getState().soloMap.tiles['1,0'].events.A).toMatchObject({ kind: 'healing', cleared: true });
  });

  it('moves between cleared locations without resetting combat state', () => {
    const store = createGameplayStoreInstance();
    startEncounterAtA(store);
    const mapAtA = completeActiveMapEncounter(store.getState().soloMap);
    const arrivalAtB = travelOnSoloMap(mapAtA, {
      kind: 'location',
      tileKey: '1,0',
      locationId: 'B',
    });
    const mapAtB = completeActiveMapEncounter(arrivalAtB.map);
    store.setState((state) => ({
      ...state,
      soloPhase: 'map',
      soloMap: mapAtB,
      enemy: state.enemy ? { ...state.enemy, health: 7 } : null,
    }));

    store.getState().travelToMapTarget({
      kind: 'location',
      tileKey: '1,0',
      locationId: 'A',
    });

    const state = store.getState();
    expect(state.soloPhase).toBe('map');
    expect(state.soloMap.playerPosition).toEqual({ tileKey: '1,0', locationId: 'A' });
    expect(state.soloMap.activeEncounter).toBeNull();
    expect(state.enemy?.health).toBe(7);
  });

  it('prevents unaffordable casts and refills mana at the start of the next player turn', () => {
    const store = createGameplayStoreInstance();
    const expensiveFireRune = createTestRune('expensive-fire', 'Fire', 3, 'common', 5);

    store.setState((state) => ({
      ...state,
      hand: [expensiveFireRune],
      selectedHandRuneId: expensiveFireRune.id,
      player: { ...state.player, mana: 4, maxMana: 7 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 20, maxHealth: 20 },
    }));

    store.getState().castRuneToWall(0, 0);
    expect(store.getState().hand).toEqual([expensiveFireRune]);
    expect(store.getState().player.mana).toBe(4);

    store.getState().endCombatTurn();
    expect(store.getState().player.mana).toBe(7);
  });

  it('selects a hand rune and completes a row-one wall slot', () => {
    const store = createGameplayStoreInstance();
    const fireRune = createTestRune('fire-1', 'Fire', 3);

    store.setState((state) => ({
      ...state,
      hand: [fireRune],
      selectedHandRuneId: null,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
    }));

    store.getState().selectHandRune(fireRune.id);
    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.hand).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
    expect(state.player.wall[0][0]).toMatchObject({ runeTypes: ['Fire'], rarity: 'common' });
    expect(state.enemy?.health).toBe(7);
    expect(state.player.mana).toBe(5);
  });

  it('casts into a neutral wall slot', () => {
    const store = createGameplayStoreInstance();
    const lifeRune = createTestRune('life-1', 'Life', 3);

    store.setState((state) => ({
      ...state,
      hand: [lifeRune],
      selectedHandRuneId: lifeRune.id,
    }));

    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.hand).toEqual([]);
    expect(state.selectedHandRuneId).toBeNull();
    expect(state.player.wall[0][0].runeTypes).toEqual(['Life']);
  });

  it('discards hand, applies enemy attack, and draws next hand on end turn', () => {
    const store = createGameplayStoreInstance();
    const hand = [createTestRune('hand-fire', 'Fire', 3)];
    const deck = [createTestRune('deck-fire', 'Fire', 3), createTestRune('deck-life', 'Life', 3)];

    store.setState((state) => ({
      ...state,
      hand,
      player: { ...state.player, deck, armor: 2, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(3);
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
      player: { ...state.player, deck: [], armor: 10, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(10);
    expect(state.player.armor).toBe(1);
    expect(state.enemyAttackSoundSignal).toBe(0);
    expect(state.shieldSoundSignal).toBe(1);
  });

  it('increments enemy attack sound signal when armor partially absorbs attack', () => {
    const store = createGameplayStoreInstance();

    store.setState((state) => ({
      ...state,
      hand: [],
      player: { ...state.player, deck: [], armor: 3, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(4);
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
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
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
    ...wall[0][3],
      id: 'completed-frost',
      runeTypes: ['Frost'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.reduceDamage', { amount: 10 })],
    };

    store.setState((state) => ({
      ...state,
      hand: [],
      player: { ...state.player, wall, deck: [], armor: 0, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(10);
    expect(state.enemyAttackSoundSignal).toBe(0);
    expect(state.shieldSoundSignal).toBe(1);
  });

  it('opens rune pack offers, returns to the map, and launches the next location', () => {
    const store = createGameplayStoreInstance();
    startEncounterAtA(store);
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
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 3, maxHealth: 3 },
      fullDeck: [lethalRune, baseDeckRune],
      player: { ...state.player, deck: [encounterDeckRune] },
    }));

    store.getState().castRuneToWall(0, 0);

    const victoryState = store.getState();
    expect(victoryState.soloPhase).toBe('reward');
    expect(victoryState.combatPhase).toBe('victory');
    expect(victoryState.soloMap.activeEncounter).toMatchObject({ tileKey: '1,0', locationId: 'A' });
    expect(victoryState.soloMap.tiles['1,0'].events.A?.cleared).toBe(false);
    expect(victoryState.deckDraftState?.offers).toHaveLength(3);
    expect(new Set(victoryState.deckDraftState?.offers.map((offer) => offer.rune.name)).size).toBe(3);
    expect(victoryState.player.wall.flat().every((cell) => cell.runeTypes.length === 0)).toBe(true);
    expect(victoryState.hand).toEqual([]);
    expect(victoryState.discardPile).toEqual([]);
    expect(victoryState.suppressedRunes).toEqual([]);
    expect(victoryState.player.deck).toEqual([encounterDeckRune]);
    expect(victoryState.fullDeck.map((rune) => rune.id)).toEqual([lethalRune.id, baseDeckRune.id]);

    const rewardOffer = victoryState.deckDraftState?.offers[0];
    const encounterDeckBeforeSelection = victoryState.player.deck;
    const fullDeckBeforeSelection = victoryState.fullDeck;
    store.getState().selectDeckDraftOffer(rewardOffer?.id as string);
    store.getState().selectDeckDraftOffer(rewardOffer?.id as string);
    expect(store.getState().deckDraftState?.selectedOffer).toBeNull();
    store.getState().selectDeckDraftOffer(rewardOffer?.id as string);

    const selectedState = store.getState();
    expect(selectedState.deckDraftState?.selectedOffer?.id).toBe(rewardOffer?.id);
    expect(selectedState.player.deck).toEqual(encounterDeckBeforeSelection);
    expect(selectedState.player.deck).toHaveLength(1);
    expect(selectedState.fullDeck).toHaveLength(fullDeckBeforeSelection.length);

    store.getState().returnToMapAfterReward();
    const mapState = store.getState();
    expect(mapState.soloPhase).toBe('map');
    expect(mapState.gameIndex).toBe(2);
    expect(mapState.deckDraftState).toBeNull();
    expect(mapState.soloMap.activeEncounter).toBeNull();
    expect(mapState.soloMap.tiles['1,0'].events.A?.cleared).toBe(true);
    expect(mapState.fullDeck).toEqual([...selectedState.fullDeck, rewardOffer?.rune]);

    store.getState().travelToMapTarget({
      kind: 'location',
      tileKey: '1,0',
      locationId: 'B',
    });
    const nextState = store.getState();
    expect(nextState.soloPhase).toBe('encounter');
    expect(nextState.soloMap.activeEncounter).toMatchObject({ tileKey: '1,0', locationId: 'B' });
    expect(nextState.soloMap.tiles['1,0'].events.B?.cleared).toBe(false);
    expect(nextState.combatPhase).toBe('player-turn');
    expect(nextState.enemy?.maxHealth).toBe(20);
    expect(nextState.suppressedRunes).toEqual([]);
    expect(nextState.discardPile).toEqual([]);
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id).sort()).toEqual(
      mapState.fullDeck.map((rune) => rune.id).sort()
    );
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id)).not.toContain(encounterDeckRune.id);
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id)).not.toContain(encounterDiscardRune.id);
    expect([...nextState.hand, ...nextState.player.deck].map((rune) => rune.id)).not.toContain(suppressedRune.id);
  });

  it('returns to the map from rewards without selecting a pack', () => {
    const store = createGameplayStoreInstance();
    startEncounterAtA(store);
    const lethalRune = createTestRune('lethal-fire', 'Fire', 20);

    store.setState((state) => ({
      ...state,
      hand: [lethalRune],
      selectedHandRuneId: lethalRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 3, maxHealth: 3 },
      fullDeck: [lethalRune],
      player: { ...state.player, deck: [] },
    }));

    store.getState().castRuneToWall(0, 0);

    const victoryState = store.getState();
    const deckSizeBeforeSkip = victoryState.fullDeck.length;
    expect(victoryState.deckDraftState?.selectedOffer).toBeNull();

    store.getState().returnToMapAfterReward();

    const nextState = store.getState();
    expect(nextState.soloPhase).toBe('map');
    expect(nextState.deckDraftState).toBeNull();
    expect(nextState.fullDeck).toHaveLength(deckSizeBeforeSkip);
    expect(nextState.soloMap.tiles['1,0'].events.A?.cleared).toBe(true);
  });

  it('ends the run without loot when Golem Lord reaches zero health', () => {
    const store = createGameplayStoreInstance();
    const lethalRune = createTestRune('boss-lethal', 'Fire', 60);
    const bossTile = {
      key: '1,0',
      x: 1,
      y: 0,
      kind: 'forest' as const,
      events: {
        A: {
          id: '1,0:A',
          locationId: 'A' as const,
          tokenId: null,
          kind: 'boss' as const,
          monsterId: 'golem-lord' as const,
          cleared: false,
        },
      },
    };

    store.setState((state) => ({
      ...state,
      gameStarted: true,
      soloPhase: 'encounter',
      arcaneDust: 7,
      hand: [lethalRune],
      selectedHandRuneId: lethalRune.id,
      player: { ...state.player, deck: [] },
      enemy: createMonsterEnemy('golem-lord'),
      soloMap: {
        ...state.soloMap,
        tiles: { ...state.soloMap.tiles, [bossTile.key]: bossTile },
        playerPosition: { tileKey: bossTile.key, locationId: 'A' },
        activeEncounter: {
          id: '1,0:A',
          tileKey: bossTile.key,
          locationId: 'A',
          monsterId: 'golem-lord',
        },
      },
    }));

    store.getState().castRuneToWall(0, 0);

    const state = store.getState();
    expect(state.isVictory).toBe(true);
    expect(state.combatPhase).toBe('victory');
    expect(state.soloPhase).toBe('encounter');
    expect(state.deckDraftState).toBeNull();
    expect(state.arcaneDust).toBe(7);
    expect(state.soloMap.activeEncounter).toBeNull();
    expect(state.soloMap.tiles['1,0'].events.A?.cleared).toBe(true);
  });

  it('ends the run when the player fills their wall against Golem Lord', () => {
    const store = createGameplayStoreInstance();
    const wall = createEmptyWall();
    wall.flat().forEach((cell, index) => {
      if (index === 0) return;
      cell.id = `filled-${index}`;
      cell.name = 'Filled';
      cell.runeTypes = ['Fire'];
      cell.rarity = 'common';
      cell.cardImageSrc = 'card.png';
      cell.tokenImageSrc = 'token.png';
      cell.castEffectRefs = [];
      cell.passiveEffectRefs = [];
    });
    const finalRune = createTestRune('boss-wall-final', 'Fire', 0);

    store.setState((state) => ({
      ...state,
      gameStarted: true,
      soloPhase: 'encounter',
      hand: [finalRune],
      selectedHandRuneId: finalRune.id,
      player: { ...state.player, wall, deck: [] },
      enemy: createMonsterEnemy('golem-lord'),
      soloMap: {
        ...state.soloMap,
        activeEncounter: {
          id: 'missing-event-is-safe',
          tileKey: '0,0',
          locationId: 'A',
          monsterId: 'golem-lord',
        },
      },
    }));

    store.getState().castRuneToWall(0, 0);

    expect(store.getState()).toMatchObject({
      isVictory: true,
      combatPhase: 'victory',
      deckDraftState: null,
    });
  });

  it('does not apply old draft bonuses or Ring/Robe draft passives to packs', () => {
    const store = createGameplayStoreInstance();
    const lethalRune = createTestRune('lethal-fire', 'Fire', 20);

    store.setState((state) => ({
      ...state,
      activeArtefacts: ['ring', 'robe'],
      hand: [lethalRune],
      selectedHandRuneId: lethalRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 3, maxHealth: 3 },
      fullDeck: [lethalRune],
      player: { ...state.player, deck: [], health: 4, maxHealth: 10 },
    }));

    store.getState().castRuneToWall(0, 0);

    const victoryState = store.getState();
    expect(victoryState.deckDraftState?.offers).toHaveLength(3);

    const offerId = victoryState.deckDraftState?.offers[0]?.id;
    store.getState().selectDeckDraftOffer(offerId as string);

    const selectedState = store.getState();
    expect(selectedState.player.health).toBe(4);
    expect(selectedState.player.maxHealth).toBe(10);
    expect(selectedState.player.deck).toEqual(victoryState.player.deck);
    expect(selectedState.fullDeck).toHaveLength(victoryState.fullDeck.length);
    expect(selectedState.deckDraftState?.selectedOffer?.id).toBe(offerId);
  });

  it('adds fortune arcane dust through gameplay store casting', () => {
    const store = createGameplayStoreInstance();
    const windRune: Rune = {
      id: 'wind-fortune',
      name: 'Wind Test',
      runeTypes: ['Wind'],
      rarity: 'common',
      cardImageSrc: 'wind-card.png',
      tokenImageSrc: 'wind-token.png',
      castEffectRefs: [createEffectRef('cast.fortune', { amount: 10 })],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand: [windRune],
      selectedHandRuneId: windRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30 },
    }));

    store.getState().castRuneToWall(0, 2);

    expect(store.getState().arcaneDust).toBe(10);
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
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
    }));

    store.getState().castRuneToWall(0, col);

    expect(store.getState().runeSoundSignals[runeType]).toBe(1);
  });

  it.each<[{ rarity: Rune['rarity']; runeType: RuneType; row: number; col: number }]>([
    [{ rarity: 'common', runeType: 'Fire', row: 0, col: 0 }],
    [{ rarity: 'uncommon', runeType: 'Frost', row: 0, col: 3 }],
    [{ rarity: 'rare', runeType: 'Void', row: 0, col: 4 }],
    [{ rarity: 'epic', runeType: 'Wind', row: 0, col: 2 }],
  ])('places a $rarity rune immediately during casting flow', ({ rarity, runeType, row, col }) => {
    const store = createGameplayStoreInstance();
    const rune = createTestRune(`${rarity}-${runeType.toLowerCase()}`, runeType, 0, rarity);

    store.setState((state) => ({
      ...state,
      hand: [rune],
      selectedHandRuneId: rune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 20, maxHealth: 20 },
      discardPile: [],
    }));

    store.getState().castRuneToWall(row, col);

    const state = store.getState();
    expect(state.player.wall[row][col]).toMatchObject({ runeTypes: [runeType], rarity });
    expect(state.discardPile).toEqual([rune]);
    expect(state.runeSoundSignals[runeType]).toBe(1);
  });

  it('increments the casting rune sound signal for non-Frost armor gain', () => {
    const store = createGameplayStoreInstance();
    const armorRune: Rune = {
      id: 'fire-armor',
      name: 'Fire Test',
      runeTypes: ['Fire'],
      rarity: 'common',
      cardImageSrc: 'fire-card.png',
      tokenImageSrc: 'fire-token.png',
      castEffectRefs: [createEffectRef('cast.armor', { amount: 3 })],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand: [armorRune],
      selectedHandRuneId: armorRune.id,
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
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
    ...wall[0][3],
      id: 'completed-frost',
      runeTypes: ['Frost'],
      rarity: 'epic',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorBoost', { amount: 5 })],
    };
    const fireRune = createTestRune('fire-1', 'Fire', 0);

    store.setState((state) => ({
      ...state,
      hand: [fireRune],
      selectedHandRuneId: fireRune.id,
      player: { ...state.player, wall, armor: 0 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
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
    ...wall[0][1],
      id: 'completed-frost',
      runeTypes: ['Frost'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 2 })],
      passiveEffectRefs: [],
    };
    const voidRune: Rune = {
      id: 'void-retrigger',
      name: 'Void Test',
      runeTypes: ['Void'],
      rarity: 'common',
      cardImageSrc: 'void-card.png',
      tokenImageSrc: 'void-token.png',
      castEffectRefs: [createEffectRef('cast.retriggerAdjacent')],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand: [voidRune],
      selectedHandRuneId: voidRune.id,
      player: { ...state.player, wall },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
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
    ...wall[0][0],
      id: 'completed-void-pulse',
      runeTypes: ['Void'],
      rarity: 'uncommon',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.pulseSynergy', { amount: 5, synergyType: 'Void' })],
    };
    wall[0][4] = {
    ...wall[0][4],
      id: 'completed-void-support',
      runeTypes: ['Void'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand,
      player: { ...state.player, wall, health: 10, armor: 0, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 5, maxHealth: 5 },
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.combatPhase).toBe('victory');
    expect(state.deckDraftState?.offers).toHaveLength(3);
    expect(state.player.health).toBe(10);
  });

  it('applies rare Frost end-turn armor before enemy attacks', () => {
    const store = createGameplayStoreInstance();
    const hand = [createTestRune('hand-fire', 'Fire', 0)];
    const wall = createEmptyWall();
    wall[0][0] = {
    ...wall[0][0],
      id: 'completed-frost-rare',
      runeTypes: ['Frost'],
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.armorEndTurnSynergy', { amount: 2, synergyType: 'Frost' })],
    };
    wall[0][1] = {
    ...wall[0][1],
      id: 'completed-frost-support',
      runeTypes: ['Frost'],
      rarity: 'common',
      castEffectRefs: [],
      passiveEffectRefs: [],
    };

    store.setState((state) => ({
      ...state,
      hand,
      player: { ...state.player, wall, health: 10, armor: 0, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
      discardPile: [],
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(5);
    expect(state.player.armor).toBe(0);
    expect(state.combatPhase).toBe('player-turn');
  });

  it('deals rare Void pulse damage after completing a top-row slot', () => {
    const store = createGameplayStoreInstance();
    const voidRune = createRuneFromPool({ id: 'void-pulse', runeType: 'Void', rarity: 'rare' });
    const wall = createEmptyWall();

    store.setState((state) => ({
      ...state,
      hand: [voidRune],
      selectedHandRuneId: voidRune.id,
      player: { ...state.player, wall, deck: [], armor: 10, health: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
      discardPile: [],
    }));

    store.getState().castRuneToWall(0, 0);
    expect(store.getState().player.wall[0][0]).toMatchObject({ runeTypes: ['Void'], rarity: 'rare' });
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
    ...wall[0][0],
      id: 'completed-life-start',
      runeTypes: ['Life'],
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.healingStartTurn', { amount: 2 })],
    };
    wall[0][1] = {
    ...wall[0][1],
      id: 'completed-wind-start',
      runeTypes: ['Wind'],
      rarity: 'rare',
      castEffectRefs: [],
      passiveEffectRefs: [createEffectRef('passive.drawingStartTurn', { amount: 1 })],
    };
    const deck = Array.from({ length: 7 }, (_, index) => createTestRune(`deck-${index}`, 'Fire', 1));

    store.setState((state) => ({
      ...state,
      hand: [createTestRune('hand-fire', 'Fire', 1)],
      player: { ...state.player, wall, deck, health: 5, maxHealth: 10, armor: 10 },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30 },
      discardPile: [],
    }));

    store.getState().endCombatTurn();

    const state = store.getState();
    expect(state.player.health).toBe(7);
    expect(state.hand).toHaveLength(6);
    expect(state.player.deck).toHaveLength(1);
  });

  it('commits a cast, pauses for manual consumption, and resumes after target selection', () => {
    const store = createGameplayStoreInstance();
    startEncounterAtA(store);
    const consumer: Rune = {
      ...createRuneFromPool({ id: 'consumer', runeType: 'Void', rarity: 'common' }),
      castEffectRefs: [
        createEffectRef('cast.damage', { amount: 2 }),
        createRuneRemovalEffectRef({
          kind: 'consume',
          trigger: 'onCast',
          selection: 'manual',
          runeType: 'Fire',
          payload: createEffectRef('cast.damage', { amount: 5 }),
        }),
      ],
    };
    const wall = createEmptyWall();
    wall[0][1] = {
      ...wall[0][1],
      id: 'adjacent-fire',
      name: 'Fire Target',
      runeTypes: ['Fire'],
      rarity: 'common',
      cardImageSrc: 'fire-card.png',
      tokenImageSrc: 'fire-token.png',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    };
    store.setState((state) => ({
      ...state,
      hand: [consumer],
      selectedHandRuneId: consumer.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
      suppressedRunes: [],
    }));

    store.getState().castRuneToWall(0, 0);

    let state = store.getState();
    expect(state.enemy?.health).toBe(8);
    expect(state.pendingCombatResolution?.target.effectRef.effectId).toBe('rune.consume');
    expect(state.hand).toEqual([]);
    expect(state.discardPile.map((rune) => rune.id)).toContain('consumer');
    expect(state.player.wall[0][1].id).toBe('adjacent-fire');
    store.getState().endCombatTurn();
    expect(store.getState().enemyTurnNumber).toBe(0);

    store.getState().selectPendingRuneTarget('player', 0, 1);

    state = store.getState();
    expect(state.pendingCombatResolution).toBeNull();
    expect(state.enemy?.health).toBe(3);
    expect(state.player.wall[0][1].id).toBeNull();
    expect(state.suppressedRunes.map((rune) => rune.id)).toContain('adjacent-fire');
  });

  it('finishes a paused cast chain before evaluating victory', () => {
    const store = createGameplayStoreInstance();
    startEncounterAtA(store);
    const consumer: Rune = {
      ...createRuneFromPool({ id: 'victory-consumer', runeType: 'Void', rarity: 'common' }),
      castEffectRefs: [
        createEffectRef('cast.damage', { amount: 10 }),
        createRuneRemovalEffectRef({ kind: 'consume', trigger: 'onCast', selection: 'manual' }),
      ],
    };
    const wall = createEmptyWall();
    wall[0][1] = { ...wall[0][1], id: 'victory-target', runeTypes: ['Fire'], rarity: 'common' };
    store.setState((state) => ({
      ...state,
      hand: [consumer],
      selectedHandRuneId: consumer.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 10, maxHealth: 10 },
    }));

    store.getState().castRuneToWall(0, 0);
    expect(store.getState().pendingCombatResolution).not.toBeNull();
    expect(store.getState().soloPhase).toBe('encounter');

    store.getState().selectPendingRuneTarget('player', 0, 1);
    expect(store.getState().pendingCombatResolution).toBeNull();
    expect(store.getState().soloPhase).toBe('reward');
  });

  it('pauses and resumes manual end-turn and start-turn consumption', () => {
    const endStore = createGameplayStoreInstance();
    startEncounterAtA(endStore);
    const endWall = createEmptyWall();
    endWall[0][0] = {
      ...endWall[0][0],
      id: 'end-source',
      runeTypes: ['Wind'],
      rarity: 'common',
      passiveEffectRefs: [createRuneRemovalEffectRef({
        kind: 'consume',
        trigger: 'endTurn',
        selection: 'manual',
        runeType: 'Fire',
        payload: createEffectRef('cast.damage', { amount: 5 }),
      })],
    };
    endWall[0][1] = { ...endWall[0][1], id: 'end-target', runeTypes: ['Fire'], rarity: 'common' };
    endStore.setState((state) => ({
      ...state,
      hand: [],
      discardPile: [],
      player: { ...state.player, wall: endWall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 20, maxHealth: 20 },
    }));

    endStore.getState().endCombatTurn();
    expect(endStore.getState().pendingCombatResolution?.continuation.kind).toBe('endTurn');
    expect(endStore.getState().enemyTurnNumber).toBe(0);
    endStore.getState().selectPendingRuneTarget('player', 0, 1);
    expect(endStore.getState().pendingCombatResolution).toBeNull();
    expect(endStore.getState().enemyTurnNumber).toBe(1);
    expect(endStore.getState().enemy?.health).toBe(15);
    expect(endStore.getState().player.wall[0][1].id).toBeNull();

    const startStore = createGameplayStoreInstance();
    startEncounterAtA(startStore);
    const startWall = createEmptyWall();
    startWall[0][0] = {
      ...startWall[0][0],
      id: 'start-source',
      runeTypes: ['Wind'],
      rarity: 'common',
      passiveEffectRefs: [createRuneRemovalEffectRef({
        kind: 'consume',
        trigger: 'startTurn',
        selection: 'manual',
        runeType: 'Fire',
        payload: createEffectRef('cast.armor', { amount: 2 }),
      })],
    };
    startWall[0][1] = { ...startWall[0][1], id: 'start-target', runeTypes: ['Fire'], rarity: 'common' };
    startStore.setState((state) => ({
      ...state,
      hand: [],
      discardPile: [],
      player: { ...state.player, wall: startWall, deck: [], health: 20, maxHealth: 20, armor: 0 },
    }));

    startStore.getState().endCombatTurn();
    expect(startStore.getState().pendingCombatResolution?.continuation.kind).toBe('startTurn');
    startStore.getState().selectPendingRuneTarget('player', 0, 1);
    expect(startStore.getState().pendingCombatResolution).toBeNull();
    expect(startStore.getState().combatPhase).toBe('player-turn');
    expect(startStore.getState().player.armor).toBe(2);
    expect(startStore.getState().player.wall[0][1].id).toBeNull();
  });

  it('skips only the current manual removal before presenting the next prompt', () => {
    const store = createGameplayStoreInstance();
    startEncounterAtA(store);
    const consumer: Rune = {
      ...createRuneFromPool({ id: 'double-consumer', runeType: 'Void', rarity: 'common' }),
      castEffectRefs: [
        createRuneRemovalEffectRef({
          kind: 'consume',
          trigger: 'onCast',
          selection: 'manual',
          payload: createEffectRef('cast.damage', { amount: 5 }),
        }),
        createRuneRemovalEffectRef({
          kind: 'consume',
          trigger: 'onCast',
          selection: 'manual',
          payload: createEffectRef('cast.damage', { amount: 3 }),
        }),
        createEffectRef('cast.damage', { amount: 1 }),
      ],
    };
    const wall = createEmptyWall();
    wall[0][1] = { ...wall[0][1], id: 'first-target', runeTypes: ['Fire'], rarity: 'common' };
    wall[0][2] = { ...wall[0][2], id: 'second-target', runeTypes: ['Life'], rarity: 'common' };
    store.setState((state) => ({
      ...state,
      hand: [consumer],
      selectedHandRuneId: consumer.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 20, maxHealth: 20 },
      suppressedRunes: [],
    }));

    store.getState().castRuneToWall(0, 0);
    expect(store.getState().pendingCombatResolution?.target.effectRef.effectId).toBe('rune.consume');

    store.getState().skipPendingRuneTarget();
    expect(store.getState().pendingCombatResolution?.target.effectRef.effectId).toBe('rune.consume');
    expect(store.getState().enemy?.health).toBe(20);

    store.getState().selectPendingRuneTarget('player', 0, 1);
    const state = store.getState();
    expect(state.pendingCombatResolution).toBeNull();
    expect(state.enemy?.health).toBe(16);
    expect(state.player.wall[0][1].id).toBeNull();
    expect(state.player.wall[0][2].id).toBe('second-target');
  });

  it('returns adjacent completed runes to hand with epic Wind', () => {
    const store = createGameplayStoreInstance();
    const epicWind = createRuneFromPool({ id: 'epic-wind', runeType: 'Wind', rarity: 'epic' });
    const wall = createEmptyWall();
    wall[0][1] = {
    ...wall[0][1],
      id: 'adjacent-life',
      runeTypes: ['Life'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.healing', { amount: 2 })],
      passiveEffectRefs: [],
    };
    store.setState((state) => ({
      ...state,
      hand: [epicWind],
      selectedHandRuneId: epicWind.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30 },
      suppressedRunes: [],
    }));

    store.getState().castRuneToWall(0, 2);

    const state = store.getState();
    expect(state.hand).toHaveLength(1);
    expect(state.hand[0]?.runeTypes[0]).toBe('Life');
    expect(state.hand[0]?.id).not.toBe('adjacent-life');
    expect(state.player.wall[0][1].runeTypes).toEqual([]);
    expect(state.suppressedRunes).toEqual([]);
  });

  it('sends returned overflow to discard when hand is already at cap after cast completion', () => {
    const store = createGameplayStoreInstance();
    const epicWind = createRuneFromPool({ id: 'epic-wind-overflow', runeType: 'Wind', rarity: 'epic' });
    const fillerHand = Array.from({ length: 9 }, (_, index) => createTestRune(`filler-${index}`, 'Fire', 0));
    const wall = createEmptyWall();
    wall[0][1] = {
    ...wall[0][1],
      id: 'adjacent-life-overflow',
      runeTypes: ['Life'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.healing', { amount: 2 })],
      passiveEffectRefs: [],
    };
    wall[1][1] = {
    ...wall[1][1],
      id: 'adjacent-fire-overflow',
      runeTypes: ['Fire'],
      rarity: 'common',
      castEffectRefs: [createEffectRef('cast.damage', { amount: 1 })],
      passiveEffectRefs: [],
    };
    store.setState((state) => ({
      ...state,
      hand: [epicWind, ...fillerHand],
      selectedHandRuneId: epicWind.id,
      player: { ...state.player, wall, deck: [] },
      enemy: { id: 'goblin', name: 'Goblin', imageSrc: '', health: 30, maxHealth: 30 },
      suppressedRunes: [],
      discardPile: [],
    }));

    store.getState().castRuneToWall(0, 2);

    const state = store.getState();
    expect(state.hand).toHaveLength(10);
    expect(state.hand.some((rune) => rune.runeTypes[0] === 'Life' || rune.runeTypes[0] === 'Fire')).toBe(true);
    expect(state.discardPile.some((rune) => rune.runeTypes[0] === 'Life' || rune.runeTypes[0] === 'Fire')).toBe(true);
    expect(state.player.wall[0][1].runeTypes).toEqual([]);
    expect(state.player.wall[1][1].runeTypes).toEqual([]);
  });

});

function createTestRune(
  id: string,
  runeType: RuneType,
  damage: number,
  rarity: Rune['rarity'] = 'common',
  manaCost?: number,
): Rune {
  return {
    id,
    name: `${runeType} Test`,
    runeTypes: [runeType],
    rarity,
    cardImageSrc: `${runeType.toLowerCase()}-card.png`,
    tokenImageSrc: `${runeType.toLowerCase()}-token.png`,
    manaCost,
    castEffectRefs: [createEffectRef('cast.damage', { amount: damage })],
    passiveEffectRefs: [],
  };
}
