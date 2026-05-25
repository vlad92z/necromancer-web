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
};

describe('soloPersistence', () => {
  beforeEach(() => {
    storage.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    vi.stubGlobal('window', { localStorage: localStorageMock });
  });

  it('saves and loads versioned solo state payloads', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState, saveSoloState } = await import('./soloPersistence');
    const state = { ...initializeSoloGame(17), gameStarted: true };

    saveSoloState(state);

    const rawPayload = storage.get('necromancer-solo-state');
    expect(rawPayload).toBeDefined();
    expect(JSON.parse(rawPayload as string)).toMatchObject({
      version: 7,
      state: {
        gameStarted: true,
        enemyMaxHealth: 17,
      },
    });
    expect(loadSoloState()).toMatchObject({
      gameStarted: true,
      enemyMaxHealth: 17,
    });
  });

  it('invalidates old raw GameState payloads', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { hasSavedSoloState, loadSoloState } = await import('./soloPersistence');
    storage.set('necromancer-solo-state', JSON.stringify(initializeSoloGame()));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
    expect(hasSavedSoloState()).toBe(false);
  });

  it('invalidates wrong-version payloads', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState } = await import('./soloPersistence');
    storage.set('necromancer-solo-state', JSON.stringify({ version: 6, state: initializeSoloGame() }));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });

  it('invalidates old versioned payloads with legacy rune effect fields', async () => {
    const { initializeSoloGame } = await import('./gameInitialization');
    const { loadSoloState } = await import('./soloPersistence');
    const legacyState = initializeSoloGame();
    const legacyRune = {
      ...legacyState.player.deck[0],
      effects: {
        cast: [{ type: 'Damage', amount: 1, rarity: 'common' }],
        passive: [],
      },
    };
    legacyState.player.deck = [legacyRune as typeof legacyState.player.deck[number], ...legacyState.player.deck.slice(1)];

    storage.set('necromancer-solo-state', JSON.stringify({ version: 2, state: legacyState }));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });
});
