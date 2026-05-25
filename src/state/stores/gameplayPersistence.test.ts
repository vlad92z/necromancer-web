import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearSoloState = vi.fn();
const saveSoloState = vi.fn();

vi.mock('../../utils/soloPersistence', () => ({
  clearSoloState,
  saveSoloState,
}));

describe('gameplayPersistence', () => {
  beforeEach(() => {
    clearSoloState.mockClear();
    saveSoloState.mockClear();
    vi.resetModules();
  });

  it('clears persisted solo state when gameplay state enters defeat', async () => {
    const subscribeGameplayState = vi.fn((listener: (state: { isDefeat: boolean; gameStarted: boolean }) => void) => {
      listener({ isDefeat: true, gameStarted: true });
      return () => {};
    });

    vi.doMock('./gameplayState', () => ({
      subscribeGameplayState,
    }));

    const { attachGameplayPersistence } = await import('./gameplayPersistence');

    attachGameplayPersistence();

    expect(subscribeGameplayState).toHaveBeenCalledTimes(1);
    expect(clearSoloState).toHaveBeenCalledTimes(1);
    expect(saveSoloState).not.toHaveBeenCalled();
  });
});