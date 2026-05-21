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
});
