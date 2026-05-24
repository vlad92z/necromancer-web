/**
 * Regression tests for removed legacy rune effect state fields.
 */

import { describe, expect, it } from 'vitest';

const FORBIDDEN_RUNTIME_TOKENS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'firstRuneEffects', pattern: /\bfirstRuneEffects\b/ },
  { label: 'primaryRuneEffects', pattern: /\bprimaryRuneEffects\b/ },
  { label: 'RuneEffects', pattern: /\bRuneEffects\b/ },
  { label: 'rune.effects', pattern: /\brune\.effects\b/ },
];

const sourceModules = import.meta.glob('../**/*.{ts,tsx}', {
  eager: true,
  query: '?raw',
  import: 'default',
});

describe('legacy effect fields', () => {
  it('does not keep legacy effect-object field references in src runtime code', () => {
    const matches = Object.entries(sourceModules)
      .filter(([path]) => !path.endsWith('.test.ts') && !path.endsWith('.test.tsx'))
      .flatMap((path) => {
        const [modulePath, source] = path as [string, string];
        return FORBIDDEN_RUNTIME_TOKENS.filter(({ pattern }) => pattern.test(source)).map(({ label }) => ({
          path: modulePath,
          token: label,
        }));
      });

    expect(matches).toEqual([]);
  });
});
