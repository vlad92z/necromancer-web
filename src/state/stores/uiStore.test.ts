import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './uiStore';

describe('player speech notifications', () => {
  beforeEach(() => {
    useUIStore.getState().clearPlayerSpeech();
  });

  it('creates a new id for repeated text and ignores a stale clear', () => {
    useUIStore.getState().showPlayerSpeech('I need mana');
    const first = useUIStore.getState().playerSpeech!;
    useUIStore.getState().showPlayerSpeech('I need mana');
    const second = useUIStore.getState().playerSpeech!;

    expect(second).toMatchObject({ message: 'I need mana' });
    expect(second.id).toBeGreaterThan(first.id);

    useUIStore.getState().clearPlayerSpeech(first.id);
    expect(useUIStore.getState().playerSpeech).toEqual(second);

    useUIStore.getState().clearPlayerSpeech(second.id);
    expect(useUIStore.getState().playerSpeech).toBeNull();

    useUIStore.getState().showPlayerSpeech('I need mana');
    expect(useUIStore.getState().playerSpeech?.id).toBeGreaterThan(second.id);
  });
});
