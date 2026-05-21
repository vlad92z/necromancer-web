/**
 * Integration tests for gameplay store persistence ownership.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
};

vi.mock('../../utils/mixpanel', () => ({
  trackDefeatEvent: vi.fn(),
  trackNewGameEvent: vi.fn(),
}));

describe('gameplayStore persistence', () => {
  beforeEach(() => {
    storage.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    vi.resetModules();
    vi.stubGlobal('window', { localStorage: localStorageMock });
  });

  it('persists solo state from the gameplay store when a run starts', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'necromancer-solo-state',
      expect.any(String)
    );

    const [, payload] = localStorageMock.setItem.mock.calls[0] ?? [];
    expect(JSON.parse(payload as string)).not.toHaveProperty('game');
    expect(JSON.parse(payload as string)).not.toHaveProperty('strain');
    expect(JSON.parse(payload as string)).not.toHaveProperty('soloDeckTemplate');
    expect(JSON.parse(payload as string)).not.toHaveProperty('soloBaseTargetScore');
    expect(JSON.parse(payload as string)).not.toHaveProperty('totalRunesPerPlayer');
    expect(JSON.parse(payload as string)).not.toHaveProperty('tooltipCards');
    expect(JSON.parse(payload as string)).not.toHaveProperty('tooltipOverrideActive');
  });

  it('continues persisting gameplay updates during an active run', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    localStorageMock.setItem.mockClear();

    store.setState((state) => ({
      ...state,
      runePowerTotal: state.runePowerTotal + 7,
    }));

    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    const [key, payload] = localStorageMock.setItem.mock.calls[0] ?? [];
    expect(key).toBe('necromancer-solo-state');
    expect(JSON.parse(payload as string)).toMatchObject({ runePowerTotal: 7, gameStarted: true });
  });

  it('syncs gameplay actions into split concern stores', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const { getGameplayState } = await import('./gameplayState');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();

    const composedState = getGameplayState();
    expect(composedState.gameStarted).toBe(true);
    expect(composedState.player).toEqual(store.getState().player);
    expect(composedState.runeforges).toEqual(store.getState().runeforges);
    expect(composedState.turnPhase).toBe(store.getState().turnPhase);
  });

  it('clears persisted solo state when the run ends in defeat', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    localStorageMock.removeItem.mockClear();

    store.setState((state) => ({
      ...state,
      isDefeat: true,
    }));

    expect(localStorageMock.removeItem).toHaveBeenCalledTimes(1);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });

  it('does not add legacy alias keys when starting the next solo game', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      gameStarted: true,
      gameIndex: 2,
      targetScore: 35,
      fullDeck: state.player.deck,
      baseTargetScore: 10,
      deckDraftReadyForNextGame: true,
      turnPhase: 'deck-draft',
      player: {
        ...state.player,
        health: 42,
        maxHealth: 77,
      },
    }));

    store.getState().startNextSoloGame();

    const nextState = store.getState() as unknown as Record<string, unknown>;
    expect(nextState.gameIndex).toBe(3);
    expect(nextState.overloadDamage).toEqual(expect.any(Number));
    expect(nextState.fullDeck).toEqual(expect.any(Array));
    expect(nextState.baseTargetScore).toBe(10);
    expect(nextState).not.toHaveProperty('game');
    expect(nextState).not.toHaveProperty('strain');
    expect(nextState).not.toHaveProperty('soloDeckTemplate');
    expect(nextState).not.toHaveProperty('soloBaseTargetScore');
    expect(nextState).not.toHaveProperty('totalRunesPerPlayer');
  });

  it('does not add totalRunesPerPlayer during deck-draft mutations', async () => {
    const { createGameplayStoreInstance } = await import('./gameplayStore');
    const store = createGameplayStoreInstance();

    store.getState().startSoloRun();
    store.setState((state) => ({
      ...state,
      turnPhase: 'deck-draft',
      deckDraftState: {
        runeforges: [],
        picksRemaining: 1,
        totalPicks: 1,
        selectionLimit: 1,
        selectionsThisOffer: 0,
      },
    }));

    const runeId = store.getState().fullDeck[0]?.id;
    expect(runeId).toBeDefined();
    store.getState().disenchantRuneFromDeck(runeId as string);

    const nextState = store.getState() as unknown as Record<string, unknown>;
    expect(nextState).not.toHaveProperty('totalRunesPerPlayer');
  });
});
