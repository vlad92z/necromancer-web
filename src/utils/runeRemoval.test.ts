import { describe, expect, it } from 'vitest';
import type { RuneRemovalEffectRef } from '../types/game';
import { createEffectRef } from './effectCatalog';
import { createEmptyWall } from './gameInitialization';
import {
  chooseRandomRunePosition,
  copyRuneEffectRef,
  createRuneRemovalEffectRef,
  getRuneRemovalCandidates,
} from './runeRemoval';

describe('runeRemoval', () => {
  it('clones typed refs and their optional payload', () => {
    const original = createRuneRemovalEffectRef({
      kind: 'consume',
      trigger: 'onCast',
      selection: 'manual',
      targetOwner: 'self',
      runeType: 'Fire',
      payload: createEffectRef('cast.damage', { amount: 5 }),
    });
    const clone = copyRuneEffectRef(original) as RuneRemovalEffectRef;

    expect(clone).toEqual(original);
    expect(clone).not.toBe(original);
    expect(clone.payload).not.toBe(original.payload);
    expect(clone.payload?.params).not.toBe(original.payload?.params);
    expect(copyRuneEffectRef(createRuneRemovalEffectRef({
      kind: 'destroy',
      trigger: 'endTurn',
      selection: 'random',
      targetOwner: 'opponent',
      count: 2,
    }))).not.toHaveProperty('payload');
    expect(createRuneRemovalEffectRef({
      kind: 'destroy', trigger: 'onCast', selection: 'random', targetOwner: 'self', count: 0,
    }).count).toBe(1);
  });

  it('matches any rune type entry, excludes the source, and preserves row-major order', () => {
    const wall = createEmptyWall(2);
    wall[0][0] = { ...wall[0][0], id: 'source', runeTypes: ['Fire'] };
    wall[0][1] = { ...wall[0][1], id: 'multi', runeTypes: ['Wind', 'Fire'] };
    wall[1][0] = { ...wall[1][0], id: 'other', runeTypes: ['Fire'] };

    expect(getRuneRemovalCandidates({
      wall,
      runeType: 'Fire',
      excludedRuneId: 'source',
    })).toEqual([{ row: 0, col: 1 }, { row: 1, col: 0 }]);
    expect(getRuneRemovalCandidates({ wall })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ]);
  });

  it('selects a deterministic random candidate', () => {
    const positions = [{ row: 0, col: 0 }, { row: 1, col: 1 }];

    expect(chooseRandomRunePosition(positions, () => 0)).toEqual(positions[0]);
    expect(chooseRandomRunePosition(positions, () => 0.999)).toEqual(positions[1]);
    expect(chooseRandomRunePosition([], () => 0)).toBeNull();
  });
});
