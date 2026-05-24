/**
 * Tests for the current solo encounter gameplay store.
 */

import { describe, expect, it } from 'vitest';
import type { Rune, RuneType } from '../../types/game';
import { createEffectRef } from '../../utils/effectCatalog';
import { createEmptyWallCharges } from '../../utils/gameInitialization';
import { createGameplayStoreInstance } from './gameplayStore';

describe('gameplayStore current combat', () => {
  it('starts a solo run with enemy, hand, draw deck, and no draft offers', () => {
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();

    const state = store.getState();
    expect(state.gameStarted).toBe(true);
    expect(state.enemy).toMatchObject({ id: 'goblin', health: 10, intent: { type: 'Attack', amount: 5 } });
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
    expect(store.getState().enemy?.maxHealth).toBe(35);
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
