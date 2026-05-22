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
      version: 2,
      state: {
        gameStarted: true,
        targetScore: 17,
      },
    });
    expect(loadSoloState()).toMatchObject({
      gameStarted: true,
      targetScore: 17,
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
    storage.set('necromancer-solo-state', JSON.stringify({ version: 1, state: initializeSoloGame() }));

    expect(loadSoloState()).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('necromancer-solo-state');
  });
});
