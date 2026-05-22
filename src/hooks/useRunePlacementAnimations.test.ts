/**
 * Tests for rune placement animation planning.
 */

import { describe, expect, it } from 'vitest';
import type { Player, Rune, RuneType } from '../types/game';
import { buildPlacementAnimationPlan } from './useRunePlacementAnimations';

function createRune(id: string, runeType: RuneType = 'Fire'): Rune {
  return { id, runeType, effects: [] };
}

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'Player',
    health: 10,
    maxHealth: 10,
    armor: 0,
    deck: [],
    patternLines: [
      { tier: 1, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null },
      { tier: 2, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null },
      { tier: 3, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null },
      { tier: 4, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null },
      { tier: 5, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null },
    ],
    wall: Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => ({ runeType: null, effects: null })),
    ),
    ...overrides,
  };
}

function createSnapshot(runes: Rune[], player: Player, overloadRuneCount = 0) {
  return {
    runeOrder: runes,
    patternLines: player.patternLines.map((line) => ({
      tier: line.tier,
      runeType: line.runeType,
      count: line.count,
    })),
    runePositions: new Map(runes.map((rune, index) => [
      rune.id,
      { centerX: 20 + index * 20, centerY: 30, size: 10 },
    ])),
    playerHealth: player.health,
    playerArmor: player.armor,
    overloadRuneCount,
  };
}

describe('buildPlacementAnimationPlan', () => {
  it('animates manual overload runes to the overload counter', () => {
    const rune = createRune('manual-overload');
    const beforePlayer = createPlayer();
    const afterPlayer = createPlayer();

    const plan = buildPlacementAnimationPlan({
      snapshot: createSnapshot([rune], beforePlayer, 0),
      player: afterPlayer,
      overloadRuneCount: 1,
      patternSlotRects: new Map(),
      overloadTargetRect: { left: 100, top: 200, width: 40, height: 40 },
    });

    expect(plan.patternSlotKeys).toEqual([]);
    expect(plan.overlayRunes).toHaveLength(1);
    expect(plan.overlayRunes[0]).toMatchObject({
      id: 'manual-overload',
      endX: 115,
      endY: 215,
      shouldDisappear: true,
    });
  });

  it('animates pattern overflow runes to the overload counter', () => {
    const placedRune = createRune('placed');
    const overflowRune = createRune('overflow');
    const beforePlayer = createPlayer();
    const afterPlayer = createPlayer({
      patternLines: beforePlayer.patternLines.map((line, index) =>
        index === 0
          ? { ...line, runeType: 'Fire', count: 1, runes: [placedRune], primaryRuneId: placedRune.id }
          : line,
      ),
    });

    const plan = buildPlacementAnimationPlan({
      snapshot: createSnapshot([placedRune, overflowRune], beforePlayer, 0),
      player: afterPlayer,
      overloadRuneCount: 1,
      patternSlotRects: new Map([['0-0', { left: 50, top: 60, width: 10, height: 10 }]]),
      overloadTargetRect: { left: 100, top: 200, width: 40, height: 40 },
    });

    expect(plan.patternSlotKeys).toEqual(['0-0']);
    expect(plan.overlayRunes.map((rune) => rune.id)).toEqual(['placed', 'overflow']);
    expect(plan.overlayRunes[0].shouldDisappear).toBeUndefined();
    expect(plan.overlayRunes[1]).toMatchObject({
      id: 'overflow',
      endX: 115,
      endY: 215,
      shouldDisappear: true,
    });
  });

  it('does not animate a canceled selection as overload', () => {
    const rune = createRune('canceled');
    const player = createPlayer();

    const plan = buildPlacementAnimationPlan({
      snapshot: createSnapshot([rune], player, 0),
      player,
      overloadRuneCount: 0,
      patternSlotRects: new Map(),
      overloadTargetRect: { left: 100, top: 200, width: 40, height: 40 },
    });

    expect(plan.overlayRunes).toEqual([]);
    expect(plan.patternSlotKeys).toEqual([]);
  });
});
