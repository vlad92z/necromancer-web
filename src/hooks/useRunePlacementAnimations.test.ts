/**
 * Tests for rune placement animation planning.
 */

import { describe, expect, it } from 'vitest';
import type { Player, Rune, RuneType } from '../types/game';
import { buildPlacementAnimationPlan } from './useRunePlacementAnimations';
import { getWallColumnForRune } from '../utils/scoring';

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
      runes: [...line.runes],
      primaryRuneId: line.primaryRuneId,
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
      deckTargetRect: null,
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
      deckTargetRect: null,
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
      deckTargetRect: null,
    });

    expect(plan.overlayRunes).toEqual([]);
    expect(plan.patternSlotKeys).toEqual([]);
  });

  it('animates reusable runes from a completed pattern line to the deck', () => {
    const primaryRune = createRune('cast-primary');
    const reusableRune = createRune('cast-reusable');
    const beforePlayer = createPlayer({
      patternLines: createPlayer().patternLines.map((line, index) =>
        index === 1
          ? {
              ...line,
              runeType: 'Fire',
              count: 2,
              runes: [primaryRune, reusableRune],
              primaryRuneId: primaryRune.id,
            }
          : line,
      ),
    });
    const wall = beforePlayer.wall.map((row) => [...row]);
    wall[1][getWallColumnForRune(1, 'Fire', wall.length)] = { runeType: 'Fire', effects: [] };
    const afterPlayer = createPlayer({
      wall,
      patternLines: beforePlayer.patternLines.map((line, index) =>
        index === 1
          ? { ...line, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null }
          : line,
      ),
    });

    const plan = buildPlacementAnimationPlan({
      snapshot: createSnapshot([], beforePlayer, 0),
      player: afterPlayer,
      overloadRuneCount: 0,
      patternSlotRects: new Map([
        ['1-0', { left: 10, top: 20, width: 10, height: 10 }],
        ['1-1', { left: 30, top: 20, width: 10, height: 10 }],
      ]),
      overloadTargetRect: null,
      deckTargetRect: { left: 100, top: 200, width: 40, height: 40 },
    });

    expect(plan.overlayRunes).toEqual([]);
    expect(plan.followUpRunes).toHaveLength(1);
    expect(plan.followUpRunes[0]).toMatchObject({
      id: 'cast-reusable',
      startX: 30,
      startY: 20,
      endX: 115,
      endY: 215,
      shouldDisappear: true,
    });
  });

  it('queues selected non-primary runes to return to deck after placement completes a line', () => {
    const primaryRune = createRune('waiting-primary');
    const reusableRune = createRune('selected-reusable');
    const beforePlayer = createPlayer({
      patternLines: createPlayer().patternLines.map((line, index) =>
        index === 1
          ? {
              ...line,
              runeType: 'Fire',
              count: 1,
              runes: [primaryRune],
              primaryRuneId: primaryRune.id,
            }
          : line,
      ),
    });
    const wall = beforePlayer.wall.map((row) => [...row]);
    wall[1][getWallColumnForRune(1, 'Fire', wall.length)] = { runeType: 'Fire', effects: [] };
    const afterPlayer = createPlayer({
      wall,
      patternLines: beforePlayer.patternLines.map((line, index) =>
        index === 1
          ? { ...line, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null }
          : line,
      ),
    });

    const plan = buildPlacementAnimationPlan({
      snapshot: createSnapshot([reusableRune], beforePlayer, 0),
      player: afterPlayer,
      overloadRuneCount: 0,
      patternSlotRects: new Map([
        ['1-0', { left: 10, top: 20, width: 10, height: 10 }],
        ['1-1', { left: 30, top: 20, width: 10, height: 10 }],
      ]),
      overloadTargetRect: null,
      deckTargetRect: { left: 100, top: 200, width: 40, height: 40 },
    });

    expect(plan.overlayRunes.map((rune) => rune.id)).toEqual(['selected-reusable']);
    expect(plan.followUpRunes).toHaveLength(1);
    expect(plan.followUpRunes[0]).toMatchObject({
      id: 'selected-reusable',
      startX: 30,
      startY: 20,
      endX: 115,
      endY: 215,
      shouldDisappear: true,
    });
  });

  it('does not animate deck return for an incomplete pattern placement', () => {
    const rune = createRune('incomplete-placement');
    const beforePlayer = createPlayer();
    const afterPlayer = createPlayer({
      patternLines: beforePlayer.patternLines.map((line, index) =>
        index === 2
          ? { ...line, runeType: 'Fire', count: 1, runes: [rune], primaryRuneId: rune.id }
          : line,
      ),
    });

    const plan = buildPlacementAnimationPlan({
      snapshot: createSnapshot([rune], beforePlayer, 0),
      player: afterPlayer,
      overloadRuneCount: 0,
      patternSlotRects: new Map([['2-0', { left: 10, top: 20, width: 10, height: 10 }]]),
      overloadTargetRect: null,
      deckTargetRect: { left: 100, top: 200, width: 40, height: 40 },
    });

    expect(plan.overlayRunes.map((animatingRune) => animatingRune.id)).toEqual(['incomplete-placement']);
    expect(plan.followUpRunes).toEqual([]);
  });

  it('animates reusable runes from multiple completed lines to the deck', () => {
    const firstPrimary = createRune('first-primary');
    const firstReusable = createRune('first-reusable');
    const secondPrimary = createRune('second-primary', 'Life');
    const secondReusable = createRune('second-reusable', 'Life');
    const basePlayer = createPlayer();
    const beforePlayer = createPlayer({
      patternLines: basePlayer.patternLines.map((line, index) => {
        if (index === 1) {
          return {
            ...line,
            runeType: 'Fire' as const,
            count: 2,
            runes: [firstPrimary, firstReusable],
            primaryRuneId: firstPrimary.id,
          };
        }
        if (index === 2) {
          return {
            ...line,
            runeType: 'Life' as const,
            count: 3,
            runes: [secondPrimary, secondReusable, createRune('second-extra', 'Life')],
            primaryRuneId: secondPrimary.id,
          };
        }
        return line;
      }),
    });
    const wall = beforePlayer.wall.map((row) => [...row]);
    wall[1][getWallColumnForRune(1, 'Fire', wall.length)] = { runeType: 'Fire', effects: [] };
    wall[2][getWallColumnForRune(2, 'Life', wall.length)] = { runeType: 'Life', effects: [] };
    const afterPlayer = createPlayer({
      wall,
      patternLines: beforePlayer.patternLines.map((line, index) =>
        index === 1 || index === 2
          ? { ...line, runeType: null, count: 0, runes: [], primaryRuneId: null, primaryRuneEffects: null }
          : line,
      ),
    });

    const plan = buildPlacementAnimationPlan({
      snapshot: createSnapshot([], beforePlayer, 0),
      player: afterPlayer,
      overloadRuneCount: 0,
      patternSlotRects: new Map([
        ['1-0', { left: 10, top: 20, width: 10, height: 10 }],
        ['1-1', { left: 30, top: 20, width: 10, height: 10 }],
        ['2-0', { left: 10, top: 40, width: 10, height: 10 }],
        ['2-1', { left: 30, top: 40, width: 10, height: 10 }],
        ['2-2', { left: 50, top: 40, width: 10, height: 10 }],
      ]),
      overloadTargetRect: null,
      deckTargetRect: { left: 100, top: 200, width: 40, height: 40 },
    });

    expect(plan.followUpRunes.map((rune) => rune.id)).toEqual([
      'first-reusable',
      'second-reusable',
      'second-extra',
    ]);
    expect(plan.followUpRunes.every((rune) => rune.shouldDisappear)).toBe(true);
  });
});
